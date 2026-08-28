'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  User,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  Building2,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
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

export default function MyAppointmentsDashboardPage() {
  const [upcoming, setUpcoming] = useState<CustomerAppointment[]>([]);
  const [past, setPast] = useState<CustomerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isCancelingId, setIsCancelingId] = useState<string | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<CustomerAppointment | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/appointments');
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
      }
    } catch (err) {
      console.error('Error fetching personal appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelModalAppointment) return;
    setIsCancelingId(cancelModalAppointment.id);

    try {
      const res = await fetch(`/api/customer/appointments?id=${cancelModalAppointment.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCancelModalAppointment(null);
        await fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelingId(null);
    }
  };

  const currentList = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Meus Agendamentos Pessoais
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Perfil Cliente
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Acompanhe os horários que você agendou em outros negócios e estabelecimentos.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAppointments}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-200 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Próximos ({upcoming.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'past'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Histórico & Concluídos ({past.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-zinc-500">Buscando seus agendamentos pessoais...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {activeTab === 'upcoming'
              ? 'Você não possui agendamentos futuros como cliente'
              : 'Nenhum histórico de agendamento anterior encontrado'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Quando você agendar um serviço ou consulta em outro estabelecimento na plataforma usando seu e-mail, ele aparecerá automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentList.map((appt) => {
            const startDate = new Date(appt.startTime);
            const endDate = new Date(appt.endTime);
            const isFinished = isPast(endDate);
            const timeRemaining = formatDistanceToNow(startDate, { addSuffix: true, locale: ptBR });
            const manageUrl = `/b/${appt.business.slug}/manage/${appt.manageToken}`;

            return (
              <div
                key={appt.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Establishment Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: appt.business.primaryColor || '#2563eb' }}
                      >
                        {appt.business.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={appt.business.logoUrl}
                            alt={appt.business.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          appt.business.name[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {appt.business.name}
                        </h4>
                        {appt.business.address && (
                          <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{appt.business.address}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : appt.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {appt.status === 'CONFIRMED'
                        ? 'Confirmado'
                        : appt.status === 'CANCELLED'
                        ? 'Cancelado'
                        : 'Pendente'}
                    </span>
                  </div>

                  {/* Service & Time details */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {appt.service.name}
                      </span>
                      <span className="font-black text-zinc-900 dark:text-zinc-100">
                        {appt.service.priceOnRequest ? 'A combinar' : formatCurrency(appt.totalPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="capitalize">
                          {format(startDate, "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] pt-1">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>Profissional: {appt.professional.name}</span>
                    </div>
                  </div>

                  {!isFinished && appt.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Em {timeRemaining}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <a
                    href={manageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Gerenciar / Remarcar</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  {!isFinished && appt.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => setCancelModalAppointment(appt)}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Cancelar Agendamento?
              </h4>
              <p className="text-xs text-zinc-500">
                Tem certeza que deseja desmarcar o serviço{' '}
                <strong>{cancelModalAppointment.service.name}</strong> em{' '}
                <strong>{cancelModalAppointment.business.name}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={Boolean(isCancelingId)}
                onClick={handleConfirmCancel}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCancelingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
