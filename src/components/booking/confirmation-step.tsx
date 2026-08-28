'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConfirmationStepProps {
  business: {
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
  };
  appointment: {
    id: string;
    customerName: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    manageToken: string;
    service: {
      name: string;
      durationMinutes: number;
    };
    professional: {
      name: string;
    };
  };
  links: {
    manageUrl: string;
    whatsAppUrl: string;
    googleCalendarUrl: string;
  };
  onNewBooking: () => void;
  primaryColor?: string;
}

export function ConfirmationStep({
  business,
  appointment,
  links,
  onNewBooking,
  primaryColor = '#2563eb',
}: ConfirmationStepProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const startDate = new Date(appointment.startTime);
  const dateFormatted = format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeFormatted = `${format(startDate, 'HH:mm')} às ${format(new Date(appointment.endTime), 'HH:mm')}`;

  const handleCopyManageLink = () => {
    navigator.clipboard.writeText(links.manageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce"
          style={{ backgroundColor: primaryColor }}
        >
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      <div>
        <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Agendamento Confirmado!
        </span>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-3">
          Tudo pronto, {appointment.customerName.split(' ')[0]}!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          Seu horário em <strong>{business.name}</strong> foi reservado com sucesso.
        </p>
      </div>

      {/* Appointment Ticket Card */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">Serviço</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {appointment.service.name}
            </p>
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {appointment.totalPrice <= 0 ? (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                A combinar
              </span>
            ) : (
              formatCurrency(appointment.totalPrice)
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              Profissional: <strong className="text-zinc-900 dark:text-zinc-100">{appointment.professional.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="capitalize">
              {dateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>{timeFormatted}</span>
          </div>

          {business.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="truncate">{business.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <a
          href={links.googleCalendarUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Adicionar ao Google Agenda</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>

        <a
          href={links.whatsAppUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Falar com o Estabelecimento</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* Manage / Reschedule link box */}
      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-left">
        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
          Precisa remarcar ou cancelar?
        </p>
        <p className="text-[11px] text-blue-700 dark:text-blue-300 mb-2">
          Guarde este link exclusivo para gerenciar seu agendamento a qualquer momento:
        </p>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            readOnly
            value={links.manageUrl}
            className="w-full text-xs bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 font-mono select-all"
          />
          <button
            type="button"
            onClick={handleCopyManageLink}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onNewBooking}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Fazer outro agendamento</span>
        </button>
      </div>
    </div>
  );
}

