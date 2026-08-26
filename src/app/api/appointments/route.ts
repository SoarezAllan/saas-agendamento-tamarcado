import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculateAvailableSlots } from '@/lib/slots';
import {
  generateCustomerConfirmationEmail,
  generateGoogleCalendarUrl,
  generateWhatsAppBookingUrl,
  sendSimulatedNotification,
} from '@/lib/notifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const professionalIdParam = searchParams.get('professionalId');
    const statusParam = searchParams.get('status');

    let businessId = session.businessId;

    if (session.role === 'SUPERADMIN' && searchParams.get('businessId')) {
      businessId = searchParams.get('businessId')!;
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 400 });
    }

    const whereClause: any = {
      businessId,
    };

    // Role-based scoping: Professional can ONLY view their own appointments
    if (session.role === 'PROFESSIONAL') {
      if (!session.professionalId) {
        return NextResponse.json({ error: 'Profissional não vinculado' }, { status: 403 });
      }
      whereClause.professionalId = session.professionalId;
    } else if (professionalIdParam && professionalIdParam !== 'all') {
      whereClause.professionalId = professionalIdParam;
    }

    if (statusParam && statusParam !== 'all') {
      whereClause.status = statusParam;
    }

    if (startDateParam && endDateParam) {
      whereClause.startTime = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      };
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
        professional: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('List appointments error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar agendamentos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      serviceId,
      professionalId,
      dateStr, // "YYYY-MM-DD"
      timeStr, // "HH:mm"
      customerName,
      customerPhone,
      customerEmail,
      notes,
    } = body;

    if (!businessId || !serviceId || !dateStr || !timeStr || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Fetch Business & Service
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const service = await db.service.findUnique({
      where: { id: serviceId, businessId, active: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // 2. Validate Slot Availability
    const availability = await calculateAvailableSlots({
      businessId,
      serviceId,
      dateStr,
      professionalId: professionalId && professionalId !== 'any' ? professionalId : null,
    });

    const matchingSlot = availability.slots.find((s) => s.time === timeStr);
    if (!matchingSlot) {
      return NextResponse.json(
        { error: 'Este horário não está mais disponível. Por favor, escolha outro.' },
        { status: 409 }
      );
    }

    // Determine final professional ID
    let finalProfessionalId = professionalId;
    if (!finalProfessionalId || finalProfessionalId === 'any') {
      finalProfessionalId = matchingSlot.suggestedProfessionalId;
    } else if (!matchingSlot.availableProfessionalIds.includes(finalProfessionalId)) {
      return NextResponse.json(
        { error: 'O profissional selecionado não está disponível neste horário.' },
        { status: 409 }
      );
    }

    const professional = await db.professional.findUnique({
      where: { id: finalProfessionalId },
    });

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    // 3. Construct Start and End Timestamps
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const startTime = new Date(year, month - 1, day, hours, minutes, 0);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    const manageToken = crypto.randomUUID();

    // 4. Create Appointment
    const appointment = await db.appointment.create({
      data: {
        businessId,
        serviceId,
        professionalId: finalProfessionalId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : null,
        notes: notes ? notes.trim() : null,
        startTime,
        endTime,
        status: 'CONFIRMED',
        totalPrice: service.price,
        manageToken,
      },
      include: {
        service: true,
        professional: true,
        business: true,
      },
    });

    // 5. Generate URLs and Notification
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const manageUrl = `${baseUrl}/b/${business.slug}/manage/${manageToken}`;
    const dateFormatted = format(startTime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const timeFormatted = `${timeStr} às ${format(endTime, 'HH:mm')}`;

    const notificationPayload = {
      businessName: business.name,
      businessPhone: business.phone || '',
      businessAddress: business.address || '',
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerEmail: appointment.customerEmail || undefined,
      serviceName: service.name,
      servicePrice: service.price,
      professionalName: professional.name,
      dateFormatted,
      timeFormatted,
      manageUrl,
      notes: appointment.notes || undefined,
    };

    const whatsAppUrl = generateWhatsAppBookingUrl(notificationPayload);
    const googleCalendarUrl = generateGoogleCalendarUrl({
      title: `${service.name} - ${business.name}`,
      description: `Agendamento com ${professional.name}\nServiço: ${service.name}\nLocal: ${business.address || business.name}\nGerenciar: ${manageUrl}`,
      location: business.address || '',
      startIso: startTime.toISOString(),
      endIso: endTime.toISOString(),
    });

    await sendSimulatedNotification('whatsapp', notificationPayload);
    if (appointment.customerEmail) {
      await sendSimulatedNotification('email', generateCustomerConfirmationEmail(notificationPayload));
    }

    return NextResponse.json(
      {
        message: 'Agendamento confirmado com sucesso!',
        appointment,
        links: {
          manageUrl,
          whatsAppUrl,
          googleCalendarUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, status, notes, professionalId, startTime, endTime } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do agendamento é obrigatório' }, { status: 400 });
    }

    const existing = await db.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Role check
    if (session.role === 'PROFESSIONAL' && existing.professionalId !== session.professionalId) {
      return NextResponse.json({ error: 'Você só pode alterar seus próprios agendamentos' }, { status: 403 });
    } else if (session.role === 'ADMIN' && existing.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (professionalId && session.role !== 'PROFESSIONAL') updateData.professionalId = professionalId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    const updated = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        professional: true,
      },
    });

    return NextResponse.json({ message: 'Agendamento atualizado com sucesso', appointment: updated });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
}

