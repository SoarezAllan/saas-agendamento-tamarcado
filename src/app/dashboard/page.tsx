'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Scissors,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  ArrowRight,
  User,
  Phone,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDuration, APPOINTMENT_STATUS_MAP } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardOverviewPage() {
  const [data, setData] = useState<{
    appointmentsToday: any[];
    upcomingAppointments: any[];
    metrics: any;
    business: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch appointments for today
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const startOfDay = `${todayStr}T00:00:00.000Z`;
      const endOfDay = `${todayStr}T23:59:59.999Z`;

      const [apptRes, finRes, bizRes] = await Promise.all([
        fetch(`/api/appointments?startDate=${startOfDay}&endDate=${endOfDay}`),
        fetch('/api/financial?period=30days'),
        fetch('/api/businesses/profile'),
      ]);

      const [apptData, finData, bizData] = await Promise.all([
        apptRes.json(),
        finRes.json(),
        bizRes.json(),
      ]);

      setData({
        appointmentsToday: apptData.appointments || [],
        upcomingAppointments: (apptData.appointments || []).slice(0, 8),
        metrics: finData.metrics || {},
        business: bizData.business || {},
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Check if user just registered a business
    if (typeof window !== 'undefined') {
      const justRegistered = sessionStorage.getItem('just_registered_business');
      const urlParams = new URLSearchParams(window.location.search);
      const isWelcome = urlParams.get('welcome') === 'true';

      if (justRegistered || isWelcome) {
        sessionStorage.removeItem('just_registered_business');
        if ((window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'AW-18409831535',
            event_category: 'registration',
            event_label: 'Novo Negocio Cadastrado',
            value: 1.0,
            currency: 'BRL',
          });
          (window as any).gtag('event', 'sign_up', {
            method: 'Email',
            event_label: 'Novo Negocio Cadastrado',
          });
        }
      }
    }
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    if (!data?.business?.slug) return;
    const url = `${window.location.origin}/b/${data.business.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const todayList = data?.appointmentsToday || [];
  const todayCount = todayList.length;
  const todayRevenue = todayList
    .filter((a) => a.status !== 'CANCELLED')
    .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

  const business = data?.business;
  const primaryColor = business?.primaryColor || '#2563eb';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Painel Geral
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Abrir Agenda Visual</span>
          </Link>
        </div>
      </div>

      {/* Interactive Onboarding Guide (Primeiros Passos) */}
      {(() => {
        const hasServices = (business?._count?.services || 0) > 0;
        const hasHours = Boolean(business?.businessHours && business.businessHours.length > 0);
        const hasCustomized = Boolean(business?.logoUrl || (business?.description && business.description.length > 5));
        const hasShared = copied;

        const completedCount = [hasServices, hasHours, hasCustomized, hasShared].filter(Boolean).length;
        const percent = Math.round((completedCount / 4) * 100);

        return (
          <div className="p-6 rounded-3xl bg-linear-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950 border border-blue-200/80 dark:border-zinc-800 shadow-sm space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full">
                  Guia de Boas-Vindas
                </span>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1.5 flex items-center gap-2">
                  <span>👋 Primeiros Passos para Ativar seu Negócio</span>
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Siga os 4 passos abaixo para deixar sua página de agendamentos 100% pronta para receber clientes.
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block">
                    {completedCount} de 4 tarefas ({percent}%)
                  </span>
                  <span className="text-[10px] text-zinc-400">Progresso de configuração</span>
                </div>
                <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              {/* Step 1 */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  hasServices
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">✂️</span>
                    {hasServices ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Concluído
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>
                  <strong className="block text-xs text-zinc-900 dark:text-zinc-100">
                    1. Cadastre seus Serviços
                  </strong>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Adicione os atendimentos ou consultas que você oferece, com duração e valor.
                  </p>
                </div>

                <Link
                  href="/dashboard/services"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-center transition-all block ${
                    hasServices
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {hasServices ? 'Gerenciar Serviços' : 'Adicionar Serviços'}
                </Link>
              </div>

              {/* Step 2 */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  hasHours
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">⏰</span>
                    {hasHours ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Configurado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>
                  <strong className="block text-xs text-zinc-900 dark:text-zinc-100">
                    2. Horários & Folgas
                  </strong>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Defina dias da semana de atendimento, intervalo de almoço e bloqueios.
                  </p>
                </div>

                <Link
                  href="/dashboard/settings"
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 transition-all block"
                >
                  Revisar Horários
                </Link>
              </div>

              {/* Step 3 */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  hasCustomized
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🎨</span>
                    {hasCustomized ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Personalizado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        Opcional
                      </span>
                    )}
                  </div>
                  <strong className="block text-xs text-zinc-900 dark:text-zinc-100">
                    3. Marca & Cores
                  </strong>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Adicione a logo do seu negócio, descrição e a cor preferida da sua página.
                  </p>
                </div>

                <Link
                  href="/dashboard/settings"
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 transition-all block"
                >
                  Personalizar Página
                </Link>
              </div>

              {/* Step 4 */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  hasShared
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🔗</span>
                    {hasShared ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                        Compartilhar
                      </span>
                    )}
                  </div>
                  <strong className="block text-xs text-zinc-900 dark:text-zinc-100">
                    4. Divulgue seu Link
                  </strong>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Envie para seus clientes pelo WhatsApp, Instagram e Google Meu Negócio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link Público'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Public Page Share Card */}
      {business?.slug && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-blue-900 to-indigo-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
              <Sparkles className="w-3 h-3" /> Sua Página Pública está Ativa
            </span>
            <h2 className="text-lg font-bold">
              Divulgue seu link para receber agendamentos 24 horas por dia!
            </h2>
            <p className="text-xs text-blue-200">
              Compartilhe na bio do Instagram, no WhatsApp ou coloque no Google Meu Negócio.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/b/${business.slug}`}
              className="bg-white/10 border border-white/20 text-white text-xs px-3 py-2 rounded-xl font-mono w-full md:w-64 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="p-2.5 bg-white text-zinc-900 hover:bg-zinc-100 font-medium rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <a
              href={`/b/${business.slug}`}
              className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Agendamentos Hoje</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {todayCount}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {todayList.filter((a) => a.status === 'COMPLETED').length} já concluídos hoje
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Previsto Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(todayRevenue)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Faturamento do dia
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Faturamento Mês</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(data?.metrics?.totalRevenue || 0)}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Ticket Médio: {formatCurrency(data?.metrics?.averageTicket || 0)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Equipe & Serviços</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {business?._count?.professionals || 0}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {business?._count?.services || 0} serviços cadastrados
          </span>
        </div>
      </div>

      {/* Today's Schedule Table / Cards */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Atendimentos de Hoje
            </h2>
            <p className="text-xs text-zinc-500">
              Lista dos agendamentos programados para a data atual
            </p>
          </div>
          <Link
            href="/dashboard/calendar"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver calendário completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayList.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Nenhum agendamento para hoje
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Novos agendamentos feitos pela página pública aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {todayList.map((appt) => {
              const statusCfg = APPOINTMENT_STATUS_MAP[appt.status] || {
                label: appt.status,
                bg: 'bg-zinc-100 text-zinc-800',
              };

              return (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 text-center shrink-0">
                      {format(new Date(appt.startTime), 'HH:mm')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {appt.customerName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>✂️ {appt.service.name}</span>
                        <span>👤 {appt.professional.name}</span>
                        <span>💰 {formatCurrency(appt.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}
                    {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

