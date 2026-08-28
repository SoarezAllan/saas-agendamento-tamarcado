import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  generateReminder24hEmail,
  generateReminder2hEmail,
  sendEmail,
  sendWhatsAppMessage,
} from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let sent24hCount = 0;
    let sent2hCount = 0;

    // ----------------------------------------------------
    // 1. SCAN FOR 24H REMINDERS (Between 23h and 25h from now)
    // ----------------------------------------------------
    const min24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const max24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const appointments24h = await db.appointment.findMany({
      where: {
        startTime: {
          gte: min24h,
          lte: max24h,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminder24hSent: false,
      },
      include: {
        service: true,
        professional: true,
        business: true,
      },
    });

    for (const appt of appointments24h) {
      const manageUrl = `${baseUrl}/b/${appt.business.slug}/manage/${appt.manageToken}`;
      const dateFormatted = format(new Date(appt.startTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const timeFormatted = `${format(new Date(appt.startTime), 'HH:mm')} às ${format(new Date(appt.endTime), 'HH:mm')}`;

      const payload = {
        businessName: appt.business.name,
        businessPhone: appt.business.phone || undefined,
        businessAddress: appt.business.address || undefined,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        customerEmail: appt.customerEmail || undefined,
        serviceName: appt.service.name,
        servicePrice: appt.totalPrice,
        professionalName: appt.professional.name,
        dateFormatted,
        timeFormatted,
        manageUrl,
        notes: appt.notes || undefined,
      };

      if (appt.customerEmail) {
        const emailContent = generateReminder24hEmail(payload);
        await sendEmail({
          to: appt.customerEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }

      if (appt.customerPhone) {
        const msg = `🔔 *Lembrete: Seu agendamento é amanhã!*\n🏢 *${appt.business.name}*\n\nOlá *${appt.customerName}*, lembramos que você tem horário marcado:\n\n✂️ *Serviço:* ${appt.service.name}\n👤 *Profissional:* ${appt.professional.name}\n⏰ *Horário:* ${timeFormatted}\n📍 *Local:* ${appt.business.address || 'A combinar'}\n\n👉 *Gerenciar / Remarcar:* ${manageUrl}`;
        await sendWhatsAppMessage({ phone: appt.customerPhone, message: msg });
      }

      await db.appointment.update({
        where: { id: appt.id },
        data: { reminder24hSent: true },
      });

      sent24hCount++;
    }

    // ----------------------------------------------------
    // 2. SCAN FOR 2H REMINDERS (Between 1h45m and 2h15m from now)
    // ----------------------------------------------------
    const min2h = new Date(now.getTime() + 105 * 60 * 1000); // 1h45m
    const max2h = new Date(now.getTime() + 135 * 60 * 1000); // 2h15m

    const appointments2h = await db.appointment.findMany({
      where: {
        startTime: {
          gte: min2h,
          lte: max2h,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminder2hSent: false,
      },
      include: {
        service: true,
        professional: true,
        business: true,
      },
    });

    for (const appt of appointments2h) {
      const manageUrl = `${baseUrl}/b/${appt.business.slug}/manage/${appt.manageToken}`;
      const dateFormatted = format(new Date(appt.startTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const timeFormatted = `${format(new Date(appt.startTime), 'HH:mm')} às ${format(new Date(appt.endTime), 'HH:mm')}`;

      const payload = {
        businessName: appt.business.name,
        businessPhone: appt.business.phone || undefined,
        businessAddress: appt.business.address || undefined,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        customerEmail: appt.customerEmail || undefined,
        serviceName: appt.service.name,
        servicePrice: appt.totalPrice,
        professionalName: appt.professional.name,
        dateFormatted,
        timeFormatted,
        manageUrl,
        notes: appt.notes || undefined,
      };

      if (appt.customerEmail) {
        const emailContent = generateReminder2hEmail(payload);
        await sendEmail({
          to: appt.customerEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }

      if (appt.customerPhone) {
        const msg = `⚡ *Seu agendamento é daqui a pouco (em 2 horas)!*\n🏢 *${appt.business.name}*\n\nOlá *${appt.customerName}*!\n\n✂️ *Serviço:* ${appt.service.name}\n⏰ *Horário:* ${timeFormatted}\n📍 *Local:* ${appt.business.address || 'A combinar'}\n\n👉 *Detalhes:* ${manageUrl}\n\nTe esperamos lá! ✨`;
        await sendWhatsAppMessage({ phone: appt.customerPhone, message: msg });
      }

      await db.appointment.update({
        where: { id: appt.id },
        data: { reminder2hSent: true },
      });

      sent2hCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      sent24hCount,
      sent2hCount,
      totalSent: sent24hCount + sent2hCount,
    });
  } catch (error: any) {
    console.error('Error running reminders cron:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar lembretes' },
      { status: 500 }
    );
  }
}

export const POST = GET;

