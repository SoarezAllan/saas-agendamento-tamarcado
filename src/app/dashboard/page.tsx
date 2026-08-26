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
              target="_blank"
              rel="noreferrer"
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

