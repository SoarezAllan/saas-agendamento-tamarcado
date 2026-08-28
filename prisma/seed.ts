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
      maxServices: 999,
      maxAppointmentsPerMonth: 150,
      features: JSON.stringify([
        'Até 2 profissionais',
        'Serviços ilimitados',
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
      maxServices: 999,
      maxAppointmentsPerMonth: 600,
      features: JSON.stringify([
        'Até 5 profissionais',
        'Serviços ilimitados',
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
      maxServices: 999,
      maxAppointmentsPerMonth: 3000,
      features: JSON.stringify([
        'Profissionais ilimitados',
        'Serviços ilimitados',
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

  // Helper for 7 days hours
  const createDefaultHours = (bizId: string) => [
    { businessId: bizId, dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '18:00' },
    { businessId: bizId, dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { businessId: bizId, dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { businessId: bizId, dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { businessId: bizId, dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { businessId: bizId, dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { businessId: bizId, dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  ];

  const createDefaultProAvailability = (proId: string) => [
    { professionalId: proId, dayOfWeek: 0, isAvailable: false, startTime: '09:00', endTime: '18:00' },
    { professionalId: proId, dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { professionalId: proId, dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { professionalId: proId, dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { professionalId: proId, dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { professionalId: proId, dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { professionalId: proId, dayOfWeek: 6, isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  ];

  // ==========================================
  // BUSINESS 1: Barbearia Vintage Club
  // ==========================================
  const barbearia = await prisma.business.create({
    data: {
      name: 'Barbearia Vintage Club',
      slug: 'barbearia-vintage',
      category: 'Barbearia',
      serviceTerm: 'Serviço',
      proTerm: 'Barbeiro',
      description: 'Estilo clássico, atendimento moderno e os melhores profissionais da cidade.',
      primaryColor: '#b45309',
      logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
      address: 'Rua Augusta, 1250 - Consolação, São Paulo - SP',
      phone: '(11) 98765-4321',
      email: 'contato@barbeariavintage.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: { create: { plan: 'PRO', status: 'ACTIVE' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Roberto Vintage (Dono)',
      email: 'admin@barbearia.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: barbearia.id,
    },
  });

  await prisma.businessHours.createMany({ data: createDefaultHours(barbearia.id) });

  const proCarlos = await prisma.professional.create({
    data: {
      businessId: barbearia.id,
      name: 'Carlos Navalha',
      email: 'carlos@barbearia.com',
      phone: '(11) 91111-2222',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Especialista em degradê na navalha, corte clássico e barba alinhada.',
    },
  });
  await prisma.user.create({
    data: {
      name: 'Carlos Navalha',
      email: 'carlos@barbearia.com',
      passwordHash: proPasswordHash,
      role: 'PROFESSIONAL',
      businessId: barbearia.id,
      professionalId: proCarlos.id,
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(proCarlos.id) });

  const proRafael = await prisma.professional.create({
    data: {
      businessId: barbearia.id,
      name: 'Rafael Tesoura de Ouro',
      email: 'rafael@barbearia.com',
      phone: '(11) 92222-3333',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: '10 anos de experiência em cortes modernos, freestyle e química capilar.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(proRafael.id) });

  const srvCorte = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Corte de Cabelo Clássico / Degradê',
      description: 'Corte completo com lavagem, finalização com pomada e toalha quente.',
      durationMinutes: 45,
      price: 55.0,
      category: 'Cabelo',
    },
  });
  const srvBarba = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Barboterapia Completa',
      description: 'Tratamento com toalha quente, óleos essenciais, massagem e navalha afiada.',
      durationMinutes: 35,
      price: 45.0,
      category: 'Barba',
    },
  });
  const srvCombo = await prisma.service.create({
    data: {
      businessId: barbearia.id,
      name: 'Combo Cabelo + Barba + Sobrancelha',
      description: 'O pacote completo para sair renovado. Inclui toalha quente e bebida cortesia.',
      durationMinutes: 75,
      price: 90.0,
      category: 'Combos',
    },
  });

  await prisma.serviceProfessional.createMany({
    data: [
      { serviceId: srvCorte.id, professionalId: proCarlos.id },
      { serviceId: srvCorte.id, professionalId: proRafael.id },
      { serviceId: srvBarba.id, professionalId: proCarlos.id },
      { serviceId: srvBarba.id, professionalId: proRafael.id },
      { serviceId: srvCombo.id, professionalId: proCarlos.id },
      { serviceId: srvCombo.id, professionalId: proRafael.id },
    ],
  });

  // Sample Appointments for Barbearia
  const today = new Date();
  await prisma.appointment.create({
    data: {
      businessId: barbearia.id,
      professionalId: proCarlos.id,
      serviceId: srvCombo.id,
      customerName: 'Lucas Ferreira',
      customerPhone: '(11) 99887-1122',
      customerEmail: 'lucas@gmail.com',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 15),
      status: 'CONFIRMED',
      totalPrice: 90.0,
      manageToken: crypto.randomUUID(),
    },
  });

  // ==========================================
  // BUSINESS 2: Albuquerque & Associados - Advocacia
  // ==========================================
  const advocacia = await prisma.business.create({
    data: {
      name: 'Albuquerque & Associados Advocacia',
      slug: 'albuquerque-advogados',
      category: 'Escritório de Advocacia',
      serviceTerm: 'Consulta Jurídica',
      proTerm: 'Advogado(a)',
      description: 'Consultoria e assessoria jurídica especializada em Direito Cível, Trabalhista, Contratos e Tributário.',
      primaryColor: '#1e3a8a', // Blue-900 / Navy
      logoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&auto=format&fit=crop&q=80',
      address: 'Av. Paulista, 2000 - Edifício Paulista Tower, Conjunto 142 - São Paulo - SP',
      phone: '(11) 3254-9000',
      email: 'contato@albuquerqueadv.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: { create: { plan: 'ENTERPRISE', status: 'ACTIVE' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dra. Mariana Albuquerque',
      email: 'admin@advocacia.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: advocacia.id,
    },
  });

  await prisma.businessHours.createMany({ data: createDefaultHours(advocacia.id) });

  const advMariana = await prisma.professional.create({
    data: {
      businessId: advocacia.id,
      name: 'Dra. Mariana Albuquerque',
      email: 'mariana@albuquerqueadv.com.br',
      phone: '(11) 98888-1111',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'Sócia fundadora. Mestre pela USP em Direito Empresarial, Contratos e Resolução de Conflitos.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(advMariana.id) });

  const advFernando = await prisma.professional.create({
    data: {
      businessId: advocacia.id,
      name: 'Dr. Fernando Costa',
      email: 'fernando@albuquerqueadv.com.br',
      phone: '(11) 97777-2222',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      bio: 'Especialista em Direito Tributário, Planejamento Patrimonial e Relações Trabalhistas.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(advFernando.id) });

  const srvConsultaJuridica = await prisma.service.create({
    data: {
      businessId: advocacia.id,
      name: 'Consulta Jurídica Inicial (Presencial ou Online)',
      description: 'Análise aprofundada do caso, diagnóstico legal preliminar e orientação estratégica de medidas.',
      durationMinutes: 60,
      price: 350.0,
      category: 'Consultoria',
    },
  });

  const srvAnaliseContrato = await prisma.service.create({
    data: {
      businessId: advocacia.id,
      name: 'Análise e Parecer de Contrato Empresarial',
      description: 'Auditoria de cláusulas, riscos de inadimplência, responsabilidade civil e proteção jurídica.',
      durationMinutes: 90,
      price: 600.0,
      category: 'Contratos',
    },
  });

  const srvAssessoriaTributaria = await prisma.service.create({
    data: {
      businessId: advocacia.id,
      name: 'Assessoria de Planejamento Tributário',
      description: 'Estruturação fiscal, redução lícita de carga tributária e conformidade fiscal para PMEs.',
      durationMinutes: 60,
      price: 0.0,
      priceOnRequest: true,
      category: 'Tributário',
    },
  });

  await prisma.serviceProfessional.createMany({
    data: [
      { serviceId: srvConsultaJuridica.id, professionalId: advMariana.id },
      { serviceId: srvConsultaJuridica.id, professionalId: advFernando.id },
      { serviceId: srvAnaliseContrato.id, professionalId: advMariana.id },
      { serviceId: srvAssessoriaTributaria.id, professionalId: advFernando.id },
    ],
  });

  await prisma.appointment.create({
    data: {
      businessId: advocacia.id,
      professionalId: advMariana.id,
      serviceId: srvConsultaJuridica.id,
      customerName: 'Construtora Horizonte Ltda',
      customerPhone: '(11) 94444-5555',
      customerEmail: 'diretoria@horizonte.com.br',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
      status: 'CONFIRMED',
      totalPrice: 350.0,
      manageToken: crypto.randomUUID(),
    },
  });

  // ==========================================
  // BUSINESS 3: Studio Vanguarda Arquitetura & Design
  // ==========================================
  const arquitetura = await prisma.business.create({
    data: {
      name: 'Studio Vanguarda Arquitetura',
      slug: 'vanguarda-arquitetura',
      category: 'Arquitetura & Design de Interiores',
      serviceTerm: 'Etapa / Reunião',
      proTerm: 'Arquiteto(a)',
      description: 'Projetos arquitetônicos residenciais, reformas comerciais e design de interiores contemporâneo.',
      primaryColor: '#0f766e', // Teal-700
      logoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&auto=format&fit=crop&q=80',
      address: 'Rua Harmonia, 450 - Vila Madalena, São Paulo - SP',
      phone: '(11) 3812-4000',
      email: 'contato@vanguardaarq.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: { create: { plan: 'PRO', status: 'ACTIVE' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Arq. Lucas Mendes',
      email: 'admin@arquitetura.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: arquitetura.id,
    },
  });

  await prisma.businessHours.createMany({ data: createDefaultHours(arquitetura.id) });

  const arqLucas = await prisma.professional.create({
    data: {
      businessId: arquitetura.id,
      name: 'Arq. Lucas Mendes',
      email: 'lucas@vanguardaarq.com.br',
      phone: '(11) 96666-1111',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Especialista em arquitetura residencial contemporânea, eficiência energética e iluminação natural.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(arqLucas.id) });

  const desBeatriz = await prisma.professional.create({
    data: {
      businessId: arquitetura.id,
      name: 'Designer Beatriz Rocha',
      email: 'beatriz@vanguardaarq.com.br',
      phone: '(11) 95555-2222',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Design de interiores, mobiliário sob medida e paletas sensoriais de acabamentos.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(desBeatriz.id) });

  const srvBriefing = await prisma.service.create({
    data: {
      businessId: arquitetura.id,
      name: 'Briefing e Alinhamento de Projeto Residencial',
      description: 'Entrevista de necessidades, estudo de viabilidade do terreno/imóvel e estimativa de cronograma.',
      durationMinutes: 60,
      price: 250.0,
      category: 'Projetos',
    },
  });

  const srvConsultoriaInteriores = await prisma.service.create({
    data: {
      businessId: arquitetura.id,
      name: 'Consultoria de Interiores & Moodboard',
      description: 'Reunião imersiva com orientações de layout, cores, revestimentos e compras de mobiliário.',
      durationMinutes: 90,
      price: 400.0,
      category: 'Interiores',
    },
  });

  const srvVisitaTecnica = await prisma.service.create({
    data: {
      businessId: arquitetura.id,
      name: 'Visita Técnica e Medição no Imóvel',
      description: 'Visita presencial para levantamento métrico, conferência estrutural e fotos técnicas.',
      durationMinutes: 120,
      price: 500.0,
      category: 'Técnico',
    },
  });

  await prisma.serviceProfessional.createMany({
    data: [
      { serviceId: srvBriefing.id, professionalId: arqLucas.id },
      { serviceId: srvBriefing.id, professionalId: desBeatriz.id },
      { serviceId: srvConsultoriaInteriores.id, professionalId: desBeatriz.id },
      { serviceId: srvVisitaTecnica.id, professionalId: arqLucas.id },
    ],
  });

  // ==========================================
  // BUSINESS 4: Clínica Estética Glow & Spa
  // ==========================================
  const clinica = await prisma.business.create({
    data: {
      name: 'Clínica Estética Glow & Spa',
      slug: 'clinica-estetica-glow',
      category: 'Clínica de Estética',
      serviceTerm: 'Procedimento',
      proTerm: 'Especialista',
      description: 'Tratamentos estéticos faciais e corporais com tecnologia de ponta e cuidado humanizado.',
      primaryColor: '#db2777', // Pink-600
      logoUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=80',
      address: 'Alameda dos Anapurus, 800 - Moema, São Paulo - SP',
      phone: '(11) 97766-5544',
      email: 'contato@clinicaglow.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: { create: { plan: 'PRO', status: 'ACTIVE' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dra. Vanessa Glow (Dona)',
      email: 'admin@glow.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: clinica.id,
    },
  });

  await prisma.businessHours.createMany({ data: createDefaultHours(clinica.id) });

  const proVanessa = await prisma.professional.create({
    data: {
      businessId: clinica.id,
      name: 'Dra. Vanessa Miranda',
      email: 'vanessa@glow.com',
      phone: '(11) 97777-8888',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813593-57351ffbb393?w=150&auto=format&fit=crop&q=80',
      bio: 'Biomédica esteta com especialização em rejuvenescimento facial e harmonização.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(proVanessa.id) });

  const srvLimpeza = await prisma.service.create({
    data: {
      businessId: clinica.id,
      name: 'Limpeza de Pele Profunda + LEDterapia',
      description: 'Higienização, extração de cravos indolor, máscara calmante e máscara de LED.',
      durationMinutes: 60,
      price: 150.0,
      category: 'Facial',
    },
  });
  const srvPeeling = await prisma.service.create({
    data: {
      businessId: clinica.id,
      name: 'Peeling Químico Renovador',
      description: 'Esfoliação química para renovação celular, redução de manchas e linhas finas.',
      durationMinutes: 45,
      price: 220.0,
      category: 'Facial',
    },
  });

  await prisma.serviceProfessional.createMany({
    data: [
      { serviceId: srvLimpeza.id, professionalId: proVanessa.id },
      { serviceId: srvPeeling.id, professionalId: proVanessa.id },
    ],
  });

  // ==========================================
  // BUSINESS 5: Dr. Sorriso Odontologia Integrada
  // ==========================================
  const odonto = await prisma.business.create({
    data: {
      name: 'Dr. Sorriso Odontologia',
      slug: 'dr-odonto',
      category: 'Consultório Odontológico',
      serviceTerm: 'Consulta / Procedimento',
      proTerm: 'Dentista',
      description: 'Odontologia moderna, prevenção, implantes, clareamento e estética dental.',
      primaryColor: '#0284c7', // Sky-600
      logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&auto=format&fit=crop&q=80',
      address: 'Rua Bela Cintra, 900 - Consolação, São Paulo - SP',
      phone: '(11) 3100-2020',
      email: 'contato@drsorriso.com.br',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscription: { create: { plan: 'STARTER', status: 'ACTIVE' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dr. Lucas Silva (Dentista Chefe)',
      email: 'admin@odonto.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      businessId: odonto.id,
    },
  });

  await prisma.businessHours.createMany({ data: createDefaultHours(odonto.id) });

  const proLucas = await prisma.professional.create({
    data: {
      businessId: odonto.id,
      name: 'Dr. Lucas Silva',
      email: 'lucas@drsorriso.com.br',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      bio: 'Cirurgião-dentista com foco em reabilitação oral e clareamento a laser.',
    },
  });
  await prisma.professionalAvailability.createMany({ data: createDefaultProAvailability(proLucas.id) });

  const srvAvaliacao = await prisma.service.create({
    data: {
      businessId: odonto.id,
      name: 'Consulta de Avaliação & Check-up Digital',
      description: 'Exame clínico minucioso com câmera intraoral e planejamento do plano de tratamento.',
      durationMinutes: 40,
      price: 120.0,
      category: 'Avaliação',
    },
  });
  const srvClareamento = await prisma.service.create({
    data: {
      businessId: odonto.id,
      name: 'Clareamento Dental a Laser em Consultório',
      description: 'Sessão com gel clareador de alta performance ativado por laser para dentes mais brancos.',
      durationMinutes: 60,
      price: 650.0,
      category: 'Estética',
    },
  });

  await prisma.serviceProfessional.createMany({
    data: [
      { serviceId: srvAvaliacao.id, professionalId: proLucas.id },
      { serviceId: srvClareamento.id, professionalId: proLucas.id },
    ],
  });

  console.log('🎉 Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('📌 Credenciais de Acesso para Testes Rápidos:');
  console.log('👑 Super Admin: superadmin@saas.com | super123');
  console.log('⚖️ Admin Advocacia: admin@advocacia.com | admin123 (Slug: /b/albuquerque-advogados)');
  console.log('📐 Admin Arquitetura: admin@arquitetura.com | admin123 (Slug: /b/vanguarda-arquitetura)');
  console.log('💈 Admin Barbearia: admin@barbearia.com | admin123 (Slug: /b/barbearia-vintage)');
  console.log('✂️ Profissional Carlos: carlos@barbearia.com | pro123');
  console.log('💆 Admin Clínica Glow: admin@glow.com | admin123 (Slug: /b/clinica-estetica-glow)');
  console.log('🦷 Admin Odontologia: admin@odonto.com | admin123 (Slug: /b/dr-odonto)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
