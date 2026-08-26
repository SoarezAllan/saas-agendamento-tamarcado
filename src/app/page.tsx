'use client';

import React from 'react';
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
  FlaskConical,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LandingPage() {
  const demoBusinesses = [
    {
      name: 'Barbearia Vintage Club',
      slug: 'barbearia-vintage',
      category: 'Barbearia (Demonstração)',
      color: '#b45309',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop&q=80',
      icon: Scissors,
      desc: 'Demonstração de cortes degradê, barba terapia e múltiplos profissionais.',
    },
    {
      name: 'Clínica Estética Glow & Spa',
      slug: 'clinica-estetica-glow',
      category: 'Clínica de Estética (Demonstração)',
      color: '#db2777',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
      icon: HeartPulse,
      desc: 'Demonstração de procedimentos faciais, massagens e agendamento por horário.',
    },
    {
      name: 'Dr. Sorriso Odontologia',
      slug: 'dr-odonto',
      category: 'Consultório Odontológico (Demonstração)',
      color: '#0284c7',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
      icon: Smile,
      desc: 'Demonstração de consultas de avaliação, profilaxia e estética dental.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight">SaaS Agendamento</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Entrar no Painel
            </Link>
            <Link
              href="/register"
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>SaaS Multi-Negócio de Agendamento Online</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
            Automatize a agenda do seu negócio e receba clientes{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
              24 horas por dia.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            A solução completa para barbearias, salões, clínicas, consultórios e pet shops.
            Página de agendamento exclusiva, cálculo de horários livres em tempo real e relatórios financeiros completos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Criar Minha Página de Agendamento (7 Dias Grátis)</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>Acessar Painel com Contas de Demonstração</span>
            </Link>
          </div>
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
              Experimente a Página Pública de Clientes em Lojas de Exemplo
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              As empresas abaixo são <strong>estabelecimentos fictícios criados para você testar</strong>.
              Você pode clicar em qualquer um deles, escolher serviços, selecionar horários e concluir agendamentos de teste para ver como seus futuros clientes serão atendidos!
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoBusinesses.map((biz) => {
              const Icon = biz.icon;

              return (
                <div
                  key={biz.slug}
                  className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border-2 border-amber-200 dark:border-amber-900/50 shadow-lg shadow-zinc-200/40 dark:shadow-none flex flex-col justify-between group hover:-translate-y-1 transition-all relative"
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

                    <div className="p-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: biz.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {biz.name}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{biz.desc}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-2">
                    <a
                      href={`/b/${biz.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      style={{ backgroundColor: biz.color }}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Abrir Demonstração do Agendamento</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>
              );
            })}
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
              Interface ultra rápida e mobile-first. Seu cliente escolhe serviço, profissional e horário sem precisar criar senha ou baixar aplicativo.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Motor Anti-Conflito de Horários</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cálculo inteligente de disponibilidade que respeita intervalos de almoço, folgas, duração de serviços e bloqueios de cada colaborador.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Relatórios Financeiros & Métricas</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Acompanhe o faturamento realizado, receita prevista, comissões por profissional, serviços mais vendidos e ticket médio.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Multi-Profissional & Portais</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cada profissional pode ter seu login para visualizar apenas sua própria agenda, enquanto o administrador tem controle global do negócio.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">WhatsApp & Google Calendar</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Confirmações instantâneas, link direto para sincronizar na agenda do Google e link seguro para o próprio cliente remarcar se precisar.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Multi-Tenant Seguro</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Isolamento total dos dados de cada negócio. Personalize suas cores, logotipo e tenha seu próprio endereço web exclusivo.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Comece a receber agendamentos online hoje mesmo
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Leva menos de 2 minutos para configurar sua página pública e compartilhar seu link com seus clientes.
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>SaaS Agendamento Multi-Negócio</span>
          </div>
          <p>© {new Date().getFullYear()} SaaS Agendamento. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">
              Painel
            </Link>
            <Link href="/register" className="hover:underline">
              Cadastrar Negócio (7 Dias Grátis)
            </Link>
            <Link href="/superadmin" className="hover:underline text-amber-600">
              Super Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
