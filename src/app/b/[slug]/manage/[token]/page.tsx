'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  XCircle,
  CalendarCheck,
  AlertTriangle,
  Loader2,
  CheckCircle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { DateTimeStep } from '@/components/booking/datetime-step';
import { formatCurrency, formatDuration, APPOINTMENT_STATUS_MAP } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CustomerManageAppointmentPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const resolvedParams = use(params);
  const { slug, token } = resolvedParams;

  const [appointment, setAppointment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAppointment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointments/manage/${token}`);
      if (!res.ok) {
        setError('Agendamento não encontrado ou link expirado');
        return;
      }
      const data = await res.json();
      setAppointment(data.appointment);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  const handleCancel = async () => {
    if (!confirm('Tem certeza de que deseja cancelar este agendamento?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/manage/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMessage('Agendamento cancelado com sucesso.');
      await fetchAppointment();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !newTime) return;
    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/appointments/manage/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESCHEDULE',
          dateStr: newDate,
          timeStr: newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMessage('Agendamento remarcado com sucesso!');
      setShowReschedulePicker(false);
      await fetchAppointment();
    } catch (err: any) {
      alert(err.message || 'Erro ao remarcar');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {error || 'Agendamento não localizado'}
        </h1>
      </div>
    );
  }

  const primaryColor = appointment.business.primaryColor || '#2563eb';
  const startDate = new Date(appointment.startTime);
  const dateFormatted = format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeFormatted = `${format(startDate, 'HH:mm')} às ${format(new Date(appointment.endTime), 'HH:mm')}`;
  const statusInfo = APPOINTMENT_STATUS_MAP[appointment.status] || {
    label: appointment.status,
    bg: 'bg-zinc-100 text-zinc-800',
  };

  const isPast = new Date() > new Date(appointment.endTime);
  const canModify = appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && !isPast;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao início</span>
          </Link>
          <Link
            href={`/b/${slug}`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Agendar novo horário →
          </Link>
        </div>

        {/* Top Business Card */}
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md mb-3 overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            {appointment.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appointment.business.logoUrl}
                alt={appointment.business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              appointment.business.name[0].toUpperCase()
            )}
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {appointment.business.name}
          </h1>
          <p className="text-xs text-zinc-500">Gerenciamento de Agendamento</p>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Appointment Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-500">Cliente</span>
              <p className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {appointment.customerName}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{appointment.service.name}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  ({formatDuration(appointment.service.durationMinutes)})
                </span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(appointment.totalPrice)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>
                Profissional: <strong>{appointment.professional.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="capitalize">{dateFormatted}</span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{timeFormatted}</span>
            </div>

            {appointment.business.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-500">{appointment.business.address}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canModify && !showReschedulePicker && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowReschedulePicker(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Remarcar Horário</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Cancelar</span>
              </button>
            </div>
          )}

          {/* Reschedule View */}
          {showReschedulePicker && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Escolha nova data e horário
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReschedulePicker(false)}
                  className="text-xs text-zinc-500 hover:underline cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              <DateTimeStep
                businessId={appointment.business.id}
                serviceId={appointment.service.id}
                professionalId={appointment.professional.id}
                selectedDate={newDate}
                selectedTime={newTime}
                onSelectDateTime={(d, t) => {
                  setNewDate(d);
                  setNewTime(t);
                }}
                primaryColor={primaryColor}
              />

              {newTime && (
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={isRescheduling}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isRescheduling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Confirmar Remarcação para {newTime}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

