'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Scissors,
  HeartPulse,
  Smile,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  TrendingUp,
  Clock,
  Users,
  MessageCircle,
  PlayCircle,
  LayoutDashboard,
  FlaskConical,
  Scale,
  Compass,
  Brain,
  Stethoscope,
  Briefcase,
  Dog,
  Dumbbell,
  GraduationCap,
  Layers,
  Video,
  Building,
  Eye,
  Loader2,
  Building2,
  Crown,
  User,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { FaqSection } from '@/components/landing/faq-and-support';
import { SupportModal } from '@/components/landing/support-modal';

export default function LandingPage() {
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleDemoLogin = async (demoEmail: string, demoPass: string, redirectUrl = '/dashboard') => {
    setLoggingInEmail(demoEmail);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao acessar conta de teste');
      }

      if (data.user?.role === 'SUPERADMIN' || redirectUrl === '/superadmin') {
        window.location.href = '/superadmin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      alert('Erro ao conectar na conta de teste. Tente novamente.');
      setLoggingInEmail(null);
    }
  };

  const demoBusinesses = [
    {
      name: 'Albuquerque & Associados Advocacia',
      slug: 'albuquerque-advogados',
      category: 'Escritório de Advocacia',
      color: '#1e3a8a',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
      icon: Scale,
      tag: 'Jurídico',
      desc: 'Consultas jurídicas, análise de contratos empresariais e assessoria tributária com advogados especialistas.',
    },
    {
      name: 'Dr. Sorriso Odontologia Integrada',
      slug: 'dr-odonto',
      category: 'Consultório Odontológico',
      color: '#0284c7',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=80',
      icon: Smile,
      tag: 'Saúde',
      desc: 'Consultas de avaliação, clareamento dental a laser e procedimentos odontológicos modernos.',
    },
    {
      name: 'Barbearia Vintage Club',
      slug: 'barbearia-vintage',
      category: 'Barbearia & Estilo',
      color: '#b45309',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop&q=80',
      icon: Scissors,
      tag: 'Beleza',
      desc: 'Cortes clássicos, degradê na navalha, barboterapia e agendamento por profissional favorito.',
    },
  ];

  const niches = [
    {
      title: 'Escritórios de Advocacia',
      desc: 'Agendamento de consultas jurídicas, reuniões presenciais ou por videoconferência com advogados por área de atuação.',
      icon: Scale,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Arquitetura & Engenharia',
      desc: 'Briefing inicial, visitas técnicas em terrenos, apresentação de plantas 3D e consultoria de interiores.',
      icon: Compass,
      color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    },
    {
      title: 'Psicologia, Terapia & TCC',
      desc: 'Sessões individuais, terapia de casal e consultas semanais com respeito a sigilo e horários reservados.',
      icon: Brain,
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Clínicas & Consultórios Médicos',
      desc: 'Consultas de rotina, avaliações especializadas, exames e procedimentos com histórico de cada paciente.',
      icon: Stethoscope,
      color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    },
    {
      title: 'Consultorias & Contabilidade',
      desc: 'Diagnósticos empresariais, planejamento tributário, auditorias e reuniões de alinhamento com clientes.',
      icon: Briefcase,
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Barbearias & Salões de Beleza',
      desc: 'Cortes, barboterapia, penteados e tratamentos capilares com escolha de barbeiro ou cabeleireiro preferido.',
      icon: Scissors,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    {
      title: 'Estética, Spas & Massoterapia',
      desc: 'Limpeza de pele, massagens relaxantes, drenagem linfática e procedimentos estéticos corporais.',
      icon: HeartPulse,
      color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    },
    {
      title: 'Pet Shops & Veterinárias',
      desc: 'Banho e tosa por porte, consultas veterinárias, vacinas e cuidados com animais de estimação.',
      icon: Dog,
      color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Personal Trainers & Estúdios',
      desc: 'Aulas particulares, treinos individuais, avaliação de bioimpedância e horários em academias/estúdios.',
      icon: Dumbbell,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
          <Logo href="/" size="md" className="shrink-0" />

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/cliente"
              className="hidden md:inline-flex px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0 items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Área do Cliente</span>
            </Link>

            <Link
              href="/login"
              className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 shrink-0"
            >
              <span>Criar Conta</span>
              <span className="hidden sm:inline">Grátis</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[650px] h-[250px] sm:h-[350px] bg-blue-500/15 blur-[100px] sm:blur-[130px] pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 max-w-full">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">TáMarcado - Agendamento Inteligente para Negócios</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.15]">
            A plataforma de agendamentos que se adapta ao{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-teal-600">
              seu modelo de negócio.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Seja você um <strong>escritório de advocacia</strong>, <strong>clínica médica</strong>, <strong>consultoria</strong>, <strong>salão de beleza</strong>, <strong>barbearia</strong> ou <strong>personal trainer</strong>: automatize sua agenda com uma página pública exclusiva, termos personalizados e cálculo de horários livres em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 sm:pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>Criar Minha Página de Agendamento (7 Dias Grátis)</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Acessar Painel de Gerenciamento</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Niches / Business Possibilities Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Infinitas Possibilidades
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
            Perfeito para qualquer negócio que atende com hora marcada
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl mx-auto">
            O sistema é flexível: você pode personalizar termos (ex: Consulta, Briefing, Sessão, Aula ou Serviço) e cadastrar sua equipe com grades horárias independentes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.title}
                className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-2.5"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${n.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {n.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Demonstration Showcase Section */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Prominent Demo Mode Explainer Banner */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border-2 border-amber-500/30 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-xs">
              <FlaskConical className="w-4 h-4" />
              Ambiente de Demonstração & Testes Interativos
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Veja a página de demonstração de diferentes negócios em funcionamento
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Clique em qualquer negócio de demonstração abaixo para testar o fluxo de agendamento em 4 passos. Sinta-se à vontade para agendar horários de teste sem custos!
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoBusinesses.map((biz) => {
              const Icon = biz.icon;

              return (
                <div
                  key={biz.slug}
                  className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/40 dark:shadow-none flex flex-col justify-between group hover:-translate-y-1 transition-all relative"
                >
                  {/* Demo Watermark Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> DEMO
                    </span>
                  </div>

                  <div>
                    <div className="h-44 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={biz.image}
                        alt={biz.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                          {biz.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: biz.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {biz.name}
                        </h3>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {biz.desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-2">
                    <a
                      href={`/b/${biz.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:opacity-95"
                      style={{ backgroundColor: biz.color }}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Testar Agendamento</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Account Profiles Demo Section */}
      <section className="py-16 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header explaining user profile views */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Painel Interno • Demonstração por Perfil de Usuário</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              Acesse o painel por dentro de acordo com cada perfil
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              A plataforma se molda ao papel de cada pessoa na empresa. Escolha um dos perfis fictícios abaixo para testar instantaneamente a visão de cada usuário com apenas 1 clique:
            </p>
          </div>

          {/* Cards for each user profile */}
          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {/* Card 1: Dono / Gestor do Negócio */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border-2 border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-amber-500/50 transition-all space-y-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    Dono / Gestor
                  </span>
                  <Scissors className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Dono / Gestor do Estabelecimento
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Barbearia Vintage Club • Gestão Completa
                  </p>
                </div>
                <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] uppercase tracking-wider">
                    O que este perfil visualiza:
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Agenda geral de todos os colaboradores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Faturamento bruto e relatório de comissões</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Controle de serviços, preços e horários</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Configurações visuais e link de agendamento</span>
                    </li>
                  </ul>
                </div>
              </div>

              <a
                href="/api/auth/demo?role=owner"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Entrar como Dono / Gestor</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* Card 2: Profissional da Equipe */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border-2 border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    Profissional / Equipe
                  </span>
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Profissional da Equipe
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Carlos Barber • Visão Individual & Restrita
                  </p>
                </div>
                <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] uppercase tracking-wider">
                    O que este perfil visualiza:
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Apenas seus próprios agendamentos</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Calendário pessoal de horários e folgas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Lista dos seus próprios clientes atendidos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-zinc-500">Sem acesso a faturamento geral ou configurações</span>
                    </li>
                  </ul>
                </div>
              </div>

              <a
                href="/api/auth/demo?role=professional"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Entrar como Profissional</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Recursos Principais
          </span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Tudo o que seu negócio precisa para crescer
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Página Pública em 4 Passos</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Interface ultra rápida e mobile-first. Seu cliente escolhe o serviço ou consulta, seleciona o profissional e reserva o melhor horário sem precisar criar senha ou baixar aplicativo.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Motor Anti-Conflito de Horários</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cálculo inteligente de disponibilidade que respeita intervalos de almoço, folgas, duração de atendimentos e bloqueios de cada advogado, arquiteto ou colaborador.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Relatórios Financeiros & Métricas</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Acompanhe honorários e faturamento realizado, receita prevista do mês, divisão por profissional e ticket médio dos seus atendimentos.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Multi-Profissional & Portais</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cada sócio, advogado ou profissional da equipe tem seu login individual para visualizar apenas seus próprios compromissos, com controle global para os administradores.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Lembretes & Google Calendar</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Confirmações por e-mail, link direto para sincronizar na agenda do Google e portal seguro para o próprio cliente remarcar ou cancelar com antecedência.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Multi-Tenant Seguro & Personalizável</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Isolamento total dos dados de cada empresa. Personalize sua paleta de cores institucional, logotipo e tenha seu próprio endereço web exclusivo.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-teal-700 text-white shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Comece a receber agendamentos 24h por dia no seu negócio
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Leva menos de 2 minutos para configurar sua página pública e compartilhar seu link com seus clientes e parceiros.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-zinc-900 bg-white hover:bg-zinc-100 shadow-lg transition-transform transform hover:scale-105"
          >
            <span>Iniciar Teste Grátis de 7 Dias</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Dúvidas Frequentes (FAQ) */}
      <FaqSection onOpenSupport={() => setIsSupportModalOpen(true)} />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo href="/" size="sm" />
          <p>© {new Date().getFullYear()} TáMarcado. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3 sm:gap-4 font-semibold">
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              Dúvidas Frequentes
            </a>
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-2xs font-bold cursor-pointer"
            >
              Suporte
            </button>
            <Link href="/cliente" className="hover:text-blue-600 font-bold transition-colors">
              Área do Cliente
            </Link>
            <Link href="/login" className="hover:underline">
              Entrar
            </Link>
            <Link href="/register" className="hover:underline">
              Cadastrar Negócio
            </Link>
          </div>
        </div>
      </footer>

      {/* Support Modal Form */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
}
