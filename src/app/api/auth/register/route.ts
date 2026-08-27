import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createAuthResponse, UserSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { businessName, category, customSlug, ownerName, email, password, phone, address } =
      await req.json();

    if (!businessName || !ownerName || !email || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user email already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado' },
        { status: 400 }
      );
    }

    // Determine slug
    let baseSlug = slugify(customSlug || businessName);
    if (!baseSlug) baseSlug = 'negocio';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await db.business.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const passwordHash = await hashPassword(password);

    // 1. Create Business (7 days free trial)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const business = await db.business.create({
      data: {
        name: businessName,
        slug: uniqueSlug,
        category: category || 'Geral',
        phone: phone || '',
        address: address || '',
        email: cleanEmail,
        trialEndsAt,
        primaryColor: '#2563eb',
        subscription: {
          create: {
            plan: 'STARTER',
            status: 'TRIALING',
            billingCycle: 'MONTHLY',
            trialEndsAt,
            currentPeriodEnd: trialEndsAt,
          },
        },
      },
    });

    // 2. Create Business Hours (Mon to Sat 09:00-18:00, Sun closed)
    for (let day = 0; day <= 6; day++) {
      await db.businessHours.create({
        data: {
          businessId: business.id,
          dayOfWeek: day,
          isOpen: day >= 1 && day <= 6,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
        },
      });
    }

    // 3. Create Default Professional (Owner)
    const professional = await db.professional.create({
      data: {
        businessId: business.id,
        name: ownerName,
        email: cleanEmail,
        phone: phone || '',
        bio: '',
        active: true,
      },
    });

    // Availability for default professional
    for (let day = 0; day <= 6; day++) {
      await db.professionalAvailability.create({
        data: {
          professionalId: professional.id,
          dayOfWeek: day,
          isAvailable: day >= 1 && day <= 6,
          startTime: '09:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
        },
      });
    }

    // 4. Create Owner User Account
    const user = await db.user.create({
      data: {
        name: ownerName,
        email: cleanEmail,
        passwordHash,
        role: 'ADMIN',
        businessId: business.id,
        professionalId: professional.id,
      },
    });

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'ADMIN',
      businessId: business.id,
      professionalId: professional.id,
    };

    return createAuthResponse(
      {
        message: 'Cadastro realizado com sucesso!',
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category: business.category,
        },
      },
      session,
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro ao cadastrar novo negócio' },
      { status: 500 }
    );
  }
}

