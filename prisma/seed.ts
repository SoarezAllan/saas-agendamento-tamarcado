import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing records
  await prisma.appointment.deleteMany();
  await prisma.serviceProfessional.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professionalAvailability.deleteMany();
  await prisma.user.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.business.deleteMany();
  await prisma.plan.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const superPasswordHash = await bcrypt.hash('super123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const proPasswordHash = await bcrypt.hash('pro123', salt);

  // 1. Create SaaS Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrador',
      email: 'superadmin@saas.com',
      passwordHash: superPasswordHash,
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Create SaaS Plans
  const plans = [
    {
      name: 'Básico Starter',
      slug: 'starter',
      priceMonthly: 49.9,
      maxProfessionals: 2,
      maxServices: 10,
      maxAppointmentsPerMonth: 150,
      features: JSON.stringify([
        'Até 2 profissionais',
        'Página pública personalizada',
        'Lembretes via WhatsApp e E-mail',
        'Relatórios básicos de faturamento',
      ]),
    },
    {
      name: 'Profissional Pro',
      slug: 'pro',
      priceMonthly: 99.9,
      maxProfessionals: 5,
      maxServices: 30,
      maxAppointmentsPerMonth: 600,
      features: JSON.stringify([
        'Até 5 profissionais',
        'Página pública com domínio e cor personalizada',
        'Lembretes automáticos ilimitados',
        'Relatórios financeiros detalhados',
        'Gestão de folgas e bloqueios',
      ]),
    },
    {
      name: 'Empresarial Enterprise',
      slug: 'enterprise',
      priceMonthly: 199.9,
      maxProfessionals: 25,
      maxServices: 100,
      maxAppointmentsPerMonth: 3000,
      features: JSON.stringify([
        'Profissionais ilimitados',
        'Múltiplas unidades/filiais',
        'Suporte prioritário 24/7',
        'Integração API direta',
        'Taxa de checkout reduzida',
      ]),
    },
  ];

  for (const p of plans) {
    await prisma.plan.create({ data: p });
  }
  console.log('✅ SaaS Plans created');

  // 3. Create Business 1: Barbearia Vintage
  const barbearia = await prisma.business.create({
    data: {
      name: 'Barbearia Vintage Club',
      slug: 'barbearia-vintage',
      category: 'Barbearia',
      description: 'Estilo clássico, atendimento moderno e os melhores profissionais da cidade.',
      primaryColor: '#b45309', // Amber-700
      logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
      address: 'Rua Augusta, 1250 - Consolação, São Paulo - SP',
      phone: '(11) 98765-4321',
      email: 'contato@barbeariavintage.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: {
        create: {
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Admin for Barbearia
  await prisma.user.create({
    data: {
      name: 'Marcelo Vintage (Dono)',
      email: 'admin@barbearia.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: barbearia.id,
    },
  });

  // Working hours for Barbearia (Mon to Sat: 09:00 - 20:00, Sun: Closed)
  for (let day = 0; day <= 6; day++) {
    await prisma.businessHours.create({
      data: {
        businessId: barbearia.id,
        dayOfWeek: day,
        isOpen: day >= 1 && day <= 6, // Closed on Sunday (0)
        openTime: '09:00',
        closeTime: '20:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    });
  }

  // Professionals for Barbearia
  const profCarlos = await prisma.professional.create({
    data: {
      businessId: barbearia.id,
      name: 'Carlos Mestre da Navalha',
      email: 'carlos@barbearia.com',
      phone: '(11) 99111-2222',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Especialista em cortes clássicos, fade degradê e alinhamento de barba com toalha quente.',
      active: true,
    },
  });

  // Create login for Carlos
  await prisma.user.create({
    data: {
      name: 'Carlos Mestre da Navalha',
      email: 'carlos@barbearia.com',
      passwordHash: proPasswordHash,
      role: 'PROFESSIONAL',
      businessId: barbearia.id,
      professionalId: profCarlos.id,
    },
  });

  const profRafael = await prisma.professional.create({
    data: {
      businessId: barbearia.id,
      name: 'Rafael Cortes',
      email: 'rafael@barbearia.com',
      phone: '(11) 99222-3333',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Especialista em visagismo masculino, cortes tesoura e tratamentos capilares.',
      active: true,
    },
  });

  const profThiago = await prisma.professional.create({
    data: {
      businessId: barbearia.id,
      name: 'Thiago Barba & Arte',
      email: 'thiago@barbearia.com',
      phone: '(11) 99333-4444',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Barbeiro experiente em pigmentação, selagem e design de sobrancelha masculina.',
      active: true,
    },
  });

  // Add individual availability for professionals
  for (const prof of [profCarlos, profRafael, profThiago]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.professionalAvailability.create({
        data: {
          professionalId: prof.id,
          dayOfWeek: day,
          isAvailable: day >= 1 && day <= 6,
          startTime: '09:00',
          endTime: '19:30',
          breakStart: '13:00',
          breakEnd: '14:00',
        },
      });
    }
  }

  // Services for Barbearia
  const srvCorte = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Corte Cabelo Degradê / Fade',
      description: 'Corte moderno com máquina e tesoura, finalização com pomada e secador.',
      durationMinutes: 30,
      price: 55.0,
      category: 'Cabelo',
      active: true,
    },
  });

  const srvBarba = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Barba Terapia com Toalha Quente',
      description: 'Desenho preciso com navalha descartável, óleos essenciais e toalha vaporizada.',
      durationMinutes: 30,
      price: 45.0,
      category: 'Barba',
      active: true,
    },
  });

  const srvCombo = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Combo Completo (Cabelo + Barba)',
      description: 'Experiência completa com corte de cabelo, barba terapia e lavagem.',
      durationMinutes: 60,
      price: 90.0,
      category: 'Combos',
      active: true,
    },
  });

  const srvPigmentacao = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Pigmentação de Barba / Cabelo',
      description: 'Correção de falhas e realce dos contornos com tintura semi-permanente.',
      durationMinutes: 30,
      price: 40.0,
      category: 'Tratamentos',
      active: true,
    },
  });

  // Link services to professionals
  for (const prof of [profCarlos, profRafael, profThiago]) {
    await prisma.serviceProfessional.create({ data: { serviceId: srvCorte.id, professionalId: prof.id } });
    await prisma.serviceProfessional.create({ data: { serviceId: srvBarba.id, professionalId: prof.id } });
    await prisma.serviceProfessional.create({ data: { serviceId: srvCombo.id, professionalId: prof.id } });
  }
  await prisma.serviceProfessional.create({ data: { serviceId: srvPigmentacao.id, professionalId: profCarlos.id } });
  await prisma.serviceProfessional.create({ data: { serviceId: srvPigmentacao.id, professionalId: profThiago.id } });

  // Sample Appointments for Barbearia (past and upcoming)
  const today = new Date();
  const sampleAppointments = [
    {
      customerName: 'Gabriel Medeiros',
      customerPhone: '(11) 98111-5555',
      customerEmail: 'gabriel@exemplo.com',
      serviceId: srvCombo.id,
      professionalId: profCarlos.id,
      hoursOffset: -24,
      startHour: 10,
      status: 'COMPLETED',
      totalPrice: 90.0,
    },
    {
      customerName: 'Lucas Ferreira',
      customerPhone: '(11) 98222-6666',
      customerEmail: 'lucas.ferreira@exemplo.com',
      serviceId: srvCorte.id,
      professionalId: profRafael.id,
      hoursOffset: -24,
      startHour: 14,
      status: 'COMPLETED',
      totalPrice: 55.0,
    },
    {
      customerName: 'Bruno Henrique',
      customerPhone: '(11) 98333-7777',
      customerEmail: 'bruno.h@exemplo.com',
      serviceId: srvCorte.id,
      professionalId: profCarlos.id,
      hoursOffset: 0,
      startHour: 11,
      status: 'CONFIRMED',
      totalPrice: 55.0,
    },
    {
      customerName: 'Matheus Albuquerque',
      customerPhone: '(11) 98444-8888',
      customerEmail: 'matheus@exemplo.com',
      serviceId: srvBarba.id,
      professionalId: profRafael.id,
      hoursOffset: 0,
      startHour: 15,
      status: 'PENDING',
      totalPrice: 45.0,
    },
    {
      customerName: 'Rodrigo Silveira',
      customerPhone: '(11) 98555-9999',
      customerEmail: 'rodrigo.silv@exemplo.com',
      serviceId: srvCombo.id,
      professionalId: profThiago.id,
      hoursOffset: 24,
      startHour: 10,
      status: 'CONFIRMED',
      totalPrice: 90.0,
    },
    {
      customerName: 'Felipe Santana',
      customerPhone: '(11) 98666-0000',
      customerEmail: 'felipe.s@exemplo.com',
      serviceId: srvPigmentacao.id,
      professionalId: profCarlos.id,
      hoursOffset: 48,
      startHour: 16,
      status: 'CONFIRMED',
      totalPrice: 40.0,
    },
  ];

  for (const item of sampleAppointments) {
    const apptDate = new Date(today);
    apptDate.setDate(apptDate.getDate() + Math.floor(item.hoursOffset / 24));
    apptDate.setHours(item.startHour, 0, 0, 0);

    const apptEndDate = new Date(apptDate);
    const service = [srvCorte, srvBarba, srvCombo, srvPigmentacao].find((s) => s.id === item.serviceId)!;
    apptEndDate.setMinutes(apptEndDate.getMinutes() + service.durationMinutes);

    await prisma.appointment.create({
      data: {
        businessId: barbearia.id,
        professionalId: item.professionalId,
        serviceId: item.serviceId,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        customerEmail: item.customerEmail,
        startTime: apptDate,
        endTime: apptEndDate,
        status: item.status,
        totalPrice: item.totalPrice,
        manageToken: crypto.randomUUID(),
      },
    });
  }

  // 4. Create Business 2: Clínica Estética Glow
  const glow = await prisma.business.create({
    data: {
      name: 'Clínica Estética Glow & Spa',
      slug: 'clinica-estetica-glow',
      category: 'Clínica de Estética',
      description: 'Cuidados avançados para sua pele, bem-estar e relaxamento total.',
      primaryColor: '#db2777', // Pink-600
      logoUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=80',
      address: 'Av. Paulista, 2000 - Cj 802 - Bela Vista, São Paulo - SP',
      phone: '(11) 97777-8888',
      email: 'contato@glowestetica.com.br',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subscription: {
        create: {
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dra. Vanessa Glow (Dona)',
      email: 'admin@glow.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: glow.id,
    },
  });

  for (let day = 0; day <= 6; day++) {
    await prisma.businessHours.create({
      data: {
        businessId: glow.id,
        dayOfWeek: day,
        isOpen: day >= 1 && day <= 5, // Mon to Fri
        openTime: '08:30',
        closeTime: '19:00',
      },
    });
  }

  const profVanessa = await prisma.professional.create({
    data: {
      businessId: glow.id,
      name: 'Dra. Vanessa Toledo',
      email: 'vanessa@glow.com',
      phone: '(11) 97111-3333',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      bio: 'Biomédica esteta especializada em rejuvenescimento facial, peelings e harmonização.',
      active: true,
    },
  });

  for (let day = 0; day <= 6; day++) {
    await prisma.professionalAvailability.create({
      data: {
        professionalId: profVanessa.id,
        dayOfWeek: day,
        isAvailable: day >= 1 && day <= 5,
        startTime: '08:30',
        endTime: '18:30',
      },
    });
  }

  const srvLimpeza = await prisma.service.create({
    data: {
      businessId: glow.id,
      name: 'Limpeza de Pele Profunda + Fototerapia',
      description: 'Remoção de cravos e impurezas, esfoliação ultrassônica e máscara de LED.',
      durationMinutes: 60,
      price: 160.0,
      category: 'Facial',
      active: true,
    },
  });

  const srvMassagem = await prisma.service.create({
    data: {
      businessId: glow.id,
      name: 'Massagem Relaxante com Aromaterapia',
      description: 'Técnicas manuais suaves, óleos aromáticos e alívio das tensões musculares.',
      durationMinutes: 60,
      price: 180.0,
      category: 'Corporal',
      active: true,
    },
  });

  await prisma.serviceProfessional.create({ data: { serviceId: srvLimpeza.id, professionalId: profVanessa.id } });
  await prisma.serviceProfessional.create({ data: { serviceId: srvMassagem.id, professionalId: profVanessa.id } });

  // 5. Create Business 3: Dr. Odontologia
  const odonto = await prisma.business.create({
    data: {
      name: 'Dr. Sorriso Odontologia Integrada',
      slug: 'dr-odonto',
      category: 'Consultório Odontológico',
      description: 'Seu sorriso em mãos experientes. Odontologia preventiva e estética moderna.',
      primaryColor: '#0284c7', // Sky-600
      address: 'Rua das Flores, 450 - Jardins, São Paulo - SP',
      phone: '(11) 96666-5555',
      email: 'contato@drsorriso.com.br',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subscription: {
        create: {
          plan: 'STARTER',
          status: 'ACTIVE',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dr. Lucas Odonto',
      email: 'admin@odonto.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: odonto.id,
    },
  });

  for (let day = 0; day <= 6; day++) {
    await prisma.businessHours.create({
      data: {
        businessId: odonto.id,
        dayOfWeek: day,
        isOpen: day >= 1 && day <= 5,
        openTime: '08:00',
        closeTime: '18:00',
      },
    });
  }

  const profLucas = await prisma.professional.create({
    data: {
      businessId: odonto.id,
      name: 'Dr. Lucas Silva (Dentista)',
      email: 'lucas@drsorriso.com.br',
      phone: '(11) 96111-2222',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
      bio: 'Cirurgião Dentista especialista em reabilitação oral e clareamento.',
      active: true,
    },
  });

  for (let day = 0; day <= 6; day++) {
    await prisma.professionalAvailability.create({
      data: {
        professionalId: profLucas.id,
        dayOfWeek: day,
        isAvailable: day >= 1 && day <= 5,
        startTime: '08:00',
        endTime: '18:00',
      },
    });
  }

  const srvAvaliacao = await prisma.service.create({
    data: {
      businessId: odonto.id,
      name: 'Consulta e Avaliação Odontológica',
      description: 'Checkup digital, exame clínico e planejamento de tratamento.',
      durationMinutes: 30,
      price: 120.0,
      category: 'Clínica Geral',
      active: true,
    },
  });

  const srvLimpezaOdonto = await prisma.service.create({
    data: {
      businessId: odonto.id,
      name: 'Profilaxia e Limpeza com Ultrassom',
      description: 'Remoção de tártaro, polimento coronário e aplicação de flúor.',
      durationMinutes: 45,
      price: 190.0,
      category: 'Prevenção',
      active: true,
    },
  });

  await prisma.serviceProfessional.create({ data: { serviceId: srvAvaliacao.id, professionalId: profLucas.id } });
  await prisma.serviceProfessional.create({ data: { serviceId: srvLimpezaOdonto.id, professionalId: profLucas.id } });

  console.log('🎉 Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('📌 Credenciais de Acesso para Testes Rápidos:');
  console.log('👑 Super Admin: superadmin@saas.com | super123');
  console.log('💈 Admin Barbearia: admin@barbearia.com | admin123 (Slug: /b/barbearia-vintage)');
  console.log('✂️ Profissional Carlos: carlos@barbearia.com | pro123');
  console.log('💆 Admin Clínica Glow: admin@glow.com | admin123 (Slug: /b/clinica-estetica-glow)');
  console.log('🦷 Admin Odontologia: admin@odonto.com | admin123 (Slug: /b/dr-odonto)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

