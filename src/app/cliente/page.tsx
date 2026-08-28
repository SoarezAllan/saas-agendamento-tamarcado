'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerAppointment {
  id: string;
  manageToken: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  notes?: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    primaryColor?: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
    priceOnRequest?: boolean;
  };
  professional: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [upcoming, setUpcoming] = useState<CustomerAppointment[]>([]);
  const [past, setPast] = useState<CustomerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'profile'>('upcoming');
  const [isCancelingId, setIsCancelingId] = useState<string | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<CustomerAppointment | null>(null);

  const fetchCustomerData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/appointments');
      if (res.status === 401) {
        router.push('/cliente/login');
        return;
      }
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
      }
    } catch (err) {
      console.error('Error loading customer dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' });
      router.push('/cliente/login');
    } catch (e) {
      router.push('/cliente/login');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalAppointment) return;
    setIsCancelingId(cancelModalAppointment.id);

    try {
      const res = await fetch(`/api/customer/appointments?id=${cancelModalAppointment.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCancelModalAppointment(null);
        await fetchCustomerData();
      }
    } catch (e) {
      console.error('Error canceling appointment:', e);
    } finally {
      setIsCancelingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold text-zinc-500">Carregando seus agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
              title="Voltar para a página inicial"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Início</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <Logo href="/" size="md" />
            <div className="hidden sm:block h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="hidden sm:inline text-xs font-bold text-zinc-500">
              Área do Cliente
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-blue-500/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel do Cliente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Olá, {customer?.name || 'Cliente'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
              Aqui você gerencia todos os seus agendamentos, recebe lembretes automáticos e tem controle total da sua agenda.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-2xl text-center">
              <span className="block text-2xl font-black">{upcoming.length}</span>
              <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider">
                Próximos
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-2xl text-center">
              <span className="block text-2xl font-black">{past.length}</span>
              <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider">
                Concluídos
              </span>
            </div>
          </div>
        </div>

        {/* Promo Banner: Cadastre seu Negócio (7 Dias Grátis) */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-linear-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-blue-950/30 border border-amber-300/60 dark:border-amber-700/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oferta Especial: 7 Dias Grátis</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
              Você também é profissional ou possui um negócio?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Crie sua própria página de agendamentos online personalizada em 1 minuto. Receba clientes 24h por dia, envie lembretes automáticos e organize sua rotina com <strong>7 dias de teste grátis sem compromisso</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sem Cartão de Crédito
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Link Personalizado Próprio
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Lembretes Automáticos por E-mail
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              href="/register"
              className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-600/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>Cadastrar Meu Negócio (7 Dias Grátis)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Próximos Agendamentos ({upcoming.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Histórico ({past.length})</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: PRÓXIMOS AGENDAMENTOS
            ======================================================== */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Nenhum agendamento futuro
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Você não possui horários marcados no momento. Quando fizer um novo agendamento, ele aparecerá aqui com contagem regressiva e lembretes automáticos!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((appt) => {
                  const startDate = new Date(appt.startTime);
                  const endDate = new Date(appt.endTime);
                  const dateLabel = format(startDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
                  const timeLabel = `${format(startDate, 'HH:mm')} às ${format(endDate, 'HH:mm')}`;
                  const countdownText = formatDistanceToNow(startDate, { locale: ptBR, addSuffix: true });
                  const primaryColor = appt.business.primaryColor || '#2563eb';
                  const manageUrl = `/b/${appt.business.slug}/manage/${appt.manageToken}`;

                  const cleanPhone = appt.business.phone?.replace(/\D/g, '') || '';
                  const whatsAppBusinessUrl = cleanPhone
                    ? `https://wa.me/55${cleanPhone}?text=Olá,%20tenho%20um%20agendamento%20para%20${encodeURIComponent(appt.service.name)}%20às%20${format(startDate, 'HH:mm')}.`
                    : null;

                  return (
                    <div
                      key={appt.id}
                      className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-4">
                        {/* Top Business & Countdown Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 overflow-hidden"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {appt.business.logoUrl ? (
                                <img
                                  src={appt.business.logoUrl}
                                  alt={appt.business.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                appt.business.name[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {appt.business.name}
                              </h4>
                              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{appt.professional.name}</span>
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            {countdownText}
                          </span>
                        </div>

                        {/* Service & Schedule Box */}
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                {appt.service.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              {appt.totalPrice > 0 ? formatCurrency(appt.totalPrice) : 'Sob consulta'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="capitalize">{dateLabel}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{timeLabel}</span>
                            <span className="text-[11px] text-zinc-400">({formatDuration(appt.service.durationMinutes)})</span>
                          </div>

                          {appt.business.address && (
                            <div className="flex items-start gap-2 text-xs text-zinc-500 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{appt.business.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {whatsAppBusinessUrl && (
                            <a
                              href={whatsAppBusinessUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                              title="Falar com o estabelecimento no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <Link
                            href={manageUrl}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            title="Remarcar data ou horário"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Remarcar</span>
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCancelModalAppointment(appt)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: HISTÓRICO DE AGENDAMENTOS PASSADOS
            ======================================================== */}
        {activeTab === 'past' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {past.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <p className="text-xs text-zinc-500">Nenhum agendamento anterior no histórico.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {past.map((appt) => {
                    const startDate = new Date(appt.startTime);
                    const isCancelled = appt.status === 'CANCELLED';

                    return (
                      <div
                        key={appt.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold shrink-0">
                            <Scissors className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {appt.service.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isCancelled
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {isCancelled ? 'Cancelado' : 'Concluído'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500">
                              {appt.business.name} • {appt.professional.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-zinc-500 font-mono">
                          <span>{format(startDate, "dd/MM/yyyy 'às' HH:mm")}</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {appt.totalPrice > 0 ? formatCurrency(appt.totalPrice) : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancellation Confirmation Modal */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Confirmar Cancelamento
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tem certeza que deseja cancelar seu agendamento de <strong>{cancelModalAppointment.service.name}</strong> em <strong>{cancelModalAppointment.business.name}</strong> no dia <strong>{format(new Date(cancelModalAppointment.startTime), "dd/MM 'às' HH:mm")}</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={Boolean(isCancelingId)}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCancelingId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Sim, Cancelar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400">
        TáMarcado © {new Date().getFullYear()} - Sistema de Agendamentos Inteligente
      </footer>
    </div>
  );
}

