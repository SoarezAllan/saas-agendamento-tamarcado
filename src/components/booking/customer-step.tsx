'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, FileText, Calendar, Clock, Scissors, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerStepProps {
  service: {
    name: string;
    durationMinutes: number;
    price: number;
    priceOnRequest?: boolean;
    category?: string | null;
  };
  professionalName: string;
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "09:00"
  onSubmit: (customerData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  primaryColor?: string;
}

export function CustomerStep({
  service,
  professionalName,
  selectedDate,
  selectedTime,
  onSubmit,
  isSubmitting,
  primaryColor = '#2563eb',
}: CustomerStepProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dateFormatted = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });

  const formatPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').substring(0, 15);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneMask(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de telefone/WhatsApp válido com DDD');
      return;
    }

    try {
      await onSubmit({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar agendamento');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Seus Dados e Confirmação
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Informe seus dados para receber o comprovante e os lembretes do agendamento
        </p>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Resumo do Agendamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Scissors className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold">{service.name}</p>
              <p className="text-xs text-zinc-500">{formatDuration(service.durationMinutes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold">{professionalName}</p>
              <p className="text-xs text-zinc-500">Profissional responsável</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold capitalize">{dateFormatted}</p>
              <p className="text-xs text-zinc-500">Data selecionada</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold">{selectedTime}</p>
              <p className="text-xs text-zinc-500">Horário</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Valor do Serviço:
          </span>
          <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {service.priceOnRequest || service.price <= 0 ? (
              <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                A combinar (sob avaliação)
              </span>
            ) : (
              formatCurrency(service.price)
            )}
          </span>
        </div>
      </div>

      {/* Customer Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 animate-in fade-in">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            WhatsApp / Celular <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Enviaremos a confirmação e lembretes para este WhatsApp
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            E-mail (opcional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Observações ou Preferências (opcional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              placeholder="Ex: Primeira vez no local, preferência por corte na tesoura..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl text-base font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirmando agendamento...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Confirmar Agendamento</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

