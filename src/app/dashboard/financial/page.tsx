'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  PieChart,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';

export default function FinancialPage() {
  const [period, setPeriod] = useState<string>('30days');
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinancialData = async (selectedPeriod: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/financial?period=${selectedPeriod}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData(period);
  }, [period]);

  const metrics = data?.metrics || {};
  const byProfessional = data?.byProfessional || [];
  const byService = data?.byService || [];

  const maxProfRevenue = byProfessional.reduce(
    (max: number, p: any) => (p.revenue > max ? p.revenue : max),
    0
  );
  const maxServiceRevenue = byService.reduce(
    (max: number, s: any) => (s.revenue > max ? s.revenue : max),
    0
  );

  const totalCompleted = metrics.statusCounts?.COMPLETED || 0;
  const totalCancelled = metrics.statusCounts?.CANCELLED || 0;
  const totalNoShow = metrics.statusCounts?.NO_SHOW || 0;
  const totalValid = (metrics.totalAppointments || 0) - totalCancelled;
  const completionRate =
    metrics.totalAppointments > 0
      ? Math.round((totalCompleted / metrics.totalAppointments) * 100)
      : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Relatórios Financeiros & Métricas
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Acompanhe o faturamento estimado, realizado e desempenho por profissional
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 self-start sm:self-auto">
          {[
            { label: 'Hoje', value: 'today' },
            { label: '7 dias', value: '7days' },
            { label: '30 dias', value: '30days' },
            { label: 'Este Ano', value: 'year' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === item.value
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-linear-to-tr from-emerald-600 to-teal-700 text-white shadow-md space-y-2">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
                Faturamento Realizado
              </span>
              <p className="text-3xl font-black">
                {formatCurrency(metrics.realizedRevenue || 0)}
              </p>
              <span className="text-[11px] text-emerald-100 block">
                Serviços concluídos e pagos
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Faturamento Total Previsto
              </span>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {formatCurrency(metrics.totalRevenue || 0)}
              </p>
              <span className="text-[11px] text-zinc-400 block">
                Inclui agendamentos confirmados
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Ticket Médio
              </span>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {formatCurrency(metrics.averageTicket || 0)}
              </p>
              <span className="text-[11px] text-zinc-400 block">
                Média gasta por cliente por visita
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Total de Atendimentos
              </span>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {metrics.totalAppointments || 0}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium block">
                Taxa de conclusão: {completionRate}%
              </span>
            </div>
          </div>

          {/* Two-Column Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Professional */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Faturamento por Profissional
                  </h3>
                </div>
                <span className="text-xs text-zinc-500">{byProfessional.length} membro(s)</span>
              </div>

              {byProfessional.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  Nenhum dado financeiro para este período.
                </p>
              ) : (
                <div className="space-y-4">
                  {byProfessional.map((prof: any) => {
                    const percentage =
                      maxProfRevenue > 0 ? Math.round((prof.revenue / maxProfRevenue) * 100) : 0;

                    return (
                      <div key={prof.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {prof.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-[11px]">
                              {prof.count} agendamento(s)
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(prof.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue by Service */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Faturamento por Serviço
                  </h3>
                </div>
                <span className="text-xs text-zinc-500">{byService.length} serviço(s)</span>
              </div>

              {byService.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  Nenhum dado financeiro para este período.
                </p>
              ) : (
                <div className="space-y-4">
                  {byService.map((srv: any) => {
                    const percentage =
                      maxServiceRevenue > 0
                        ? Math.round((srv.revenue / maxServiceRevenue) * 100)
                        : 0;

                    return (
                      <div key={srv.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {srv.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-[11px]">
                              {srv.count} realizado(s)
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(srv.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Status dos Agendamentos no Período
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 font-medium block">Concluídos</span>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
                  {totalCompleted}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-700 font-medium block">Confirmados</span>
                <span className="text-xl font-black text-blue-800 dark:text-blue-300 mt-1 block">
                  {metrics.statusCounts?.CONFIRMED || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <span className="text-xs text-amber-700 font-medium block">Pendentes</span>
                <span className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1 block">
                  {metrics.statusCounts?.PENDING || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                <span className="text-xs text-rose-700 font-medium block">Cancelados</span>
                <span className="text-xl font-black text-rose-800 dark:text-rose-300 mt-1 block">
                  {totalCancelled}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-600 font-medium block">Não Compareceu</span>
                <span className="text-xl font-black text-zinc-800 dark:text-zinc-200 mt-1 block">
                  {totalNoShow}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

