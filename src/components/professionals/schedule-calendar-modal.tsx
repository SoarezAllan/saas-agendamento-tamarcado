'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Trash2,
  CalendarCheck,
  Palmtree,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  isBefore,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleCalendarProps {
  professional: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isAdmin?: boolean;
}

export function ScheduleCalendarModal({
  professional,
  isOpen,
  onClose,
  onSaved,
  isAdmin = false,
}: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Day editor state
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [dayType, setDayType] = useState<'day_off' | 'custom_hours'>('day_off');
  const [dayReason, setDayReason] = useState('Folga');
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('18:00');
  const [customBreakStart, setCustomBreakStart] = useState('12:00');
  const [customBreakEnd, setCustomBreakEnd] = useState('13:00');

  // Batch Range Modal state
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rangeEndDate, setRangeEndDate] = useState(
    format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [rangeType, setRangeType] = useState<'vacation' | 'weekend_off'>('vacation');
  const [rangeReason, setRangeReason] = useState('Férias');
  const [isSavingRange, setIsSavingRange] = useState(false);

  const fetchOverrides = async () => {
    if (!professional?.id) return;
    setIsLoading(true);
    try {
      const monthStart = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
      const monthEnd = format(endOfWeek(endOfMonth(addMonths(currentMonth, 1))), 'yyyy-MM-dd');

      const res = await fetch(
        `/api/professionals/overrides?professionalId=${professional.id}&startDate=${monthStart}&endDate=${monthEnd}`
      );
      const data = await res.json();
      setOverrides(data.overrides || []);
    } catch (err) {
      console.error('Error fetching overrides:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && professional?.id) {
      fetchOverrides();
    }
  }, [isOpen, professional?.id, currentMonth]);

  if (!isOpen || !professional) return null;

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();

    const override = overrides.find((o) => o.date === dateStr);
    if (override) {
      if (!override.isAvailable) {
        return {
          type: 'override_off',
          label: override.reason || 'Folga',
          isWorking: false,
          color: 'bg-rose-500 text-white dark:bg-rose-600',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200',
          override,
        };
      } else {
        return {
          type: 'override_work',
          label: `${override.startTime || '09:00'}-${override.endTime || '18:00'}`,
          isWorking: true,
          color: 'bg-amber-500 text-white dark:bg-amber-600',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200',
          override,
        };
      }
    }

    const weeklyAvail = professional.availabilities?.find((a: any) => a.dayOfWeek === dayOfWeek);
    if (weeklyAvail && !weeklyAvail.isAvailable) {
      return {
        type: 'weekly_off',
        label: 'Folga Semanal',
        isWorking: false,
        color: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200',
      };
    }

    const startTime = weeklyAvail?.startTime || '09:00';
    const endTime = weeklyAvail?.endTime || '18:00';
    return {
      type: 'weekly_work',
      label: `${startTime}-${endTime}`,
      isWorking: true,
      color: 'bg-emerald-500 text-white dark:bg-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
      startTime,
      endTime,
    };
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = overrides.find((o) => o.date === dateStr);

    if (existing) {
      if (!existing.isAvailable) {
        setDayType('day_off');
        setDayReason(existing.reason || 'Folga');
      } else {
        setDayType('custom_hours');
        setDayReason(existing.reason || 'Horário Especial');
        setCustomStartTime(existing.startTime || '09:00');
        setCustomEndTime(existing.endTime || '18:00');
        setCustomBreakStart(existing.breakStart || '12:00');
        setCustomBreakEnd(existing.breakEnd || '13:00');
      }
    } else {
      const status = getDayStatus(day);
      if (status.isWorking) {
        setDayType('day_off');
        setDayReason('Folga');
        setCustomStartTime(status.startTime || '09:00');
        setCustomEndTime(status.endTime || '18:00');
      } else {
        setDayType('custom_hours');
        setDayReason('Plantão Extra');
        setCustomStartTime('09:00');
        setCustomEndTime('18:00');
      }
    }
  };

  const handleSaveDayOverride = async () => {
    if (!selectedDay) return;
    setIsSavingDay(true);
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      await fetch('/api/professionals/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: professional.id,
          date: dateStr,
          isAvailable: dayType === 'custom_hours',
          reason: dayReason,
          startTime: customStartTime,
          endTime: customEndTime,
          breakStart: customBreakStart,
          breakEnd: customBreakEnd,
        }),
      });

      await fetchOverrides();
      setSelectedDay(null);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alteração do dia');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleResetDayOverride = async () => {
    if (!selectedDay) return;
    setIsSavingDay(true);
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      await fetch(
        `/api/professionals/overrides?professionalId=${professional.id}&date=${dateStr}`,
        { method: 'DELETE' }
      );

      await fetchOverrides();
      setSelectedDay(null);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar dia');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleSaveBatchRange = async () => {
    setIsSavingRange(true);
    try {
      const [startYear, startMonth, startD] = rangeStartDate.split('-').map(Number);
      const [endYear, endMonth, endD] = rangeEndDate.split('-').map(Number);

      const start = new Date(startYear, startMonth - 1, startD);
      const end = new Date(endYear, endMonth - 1, endD);

      const allDaysInRange = eachDayOfInterval({ start, end });
      const targetDates = allDaysInRange.map((d) => format(d, 'yyyy-MM-dd'));

      await fetch('/api/professionals/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: professional.id,
          dates: targetDates,
          isAvailable: false, // Bloquear período / Férias
          reason: rangeReason || 'Férias Programadas',
        }),
      });

      await fetchOverrides();
      setIsRangeModalOpen(false);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert('Erro ao aplicar folga em lote');
    } finally {
      setIsSavingRange(false);
    }
  };

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Calendário de Escalas & Folgas: ${professional.name}`}
      description="Gerencie os horários, plantões e marque folgas ou férias programadas até o próximo mês"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Month Selector & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center sm:text-left min-w-36">
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <span className="text-[11px] text-zinc-500">
                {isLoading ? 'Atualizando escala...' : `${overrides.length} exceções cadastradas`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(new Date(), 1))}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              Próximo Mês
            </button>
            <button
              type="button"
              onClick={() => setIsRangeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Palmtree className="w-3.5 h-3.5" />
              <span>Programar Férias / Bloqueio em Lote</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] flex-wrap text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Jornada Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Folga / Férias (Bloqueado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Horário Especial / Plantão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span>Folga Semanal Padrão</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 py-2.5">
            {weekDayNames.map((d, i) => (
              <span key={d} className={i === 0 || i === 6 ? 'text-rose-500' : ''}>
                {d}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {calendarDays.map((day) => {
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDay = isToday(day);
              const status = getDayStatus(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = selectedDay && isSameDay(selectedDay, day);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleSelectDay(day)}
                  className={`min-h-24 p-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                    !inCurrentMonth ? 'opacity-30 bg-zinc-50/50 dark:bg-zinc-900/30' : ''
                  } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isTodayDay
                          ? 'bg-blue-600 text-white shadow-xs'
                          : inCurrentMonth
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {status.override && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                          status.isWorking
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                        title="Modificado para esta data específica"
                      >
                        {status.override.reason || 'Alterado'}
                      </span>
                    )}
                  </div>

                  {/* Shift preview */}
                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg block truncate text-center ${
                        status.badge
                      }`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <span className="text-[9px] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 text-center block mt-1 transition-opacity">
                    Clique para alterar
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Quick Editor */}
        {selectedDay && (
          <div className="p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                  Configurar dia: {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setDayType('day_off')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  dayType === 'day_off'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                    : 'border-zinc-200 bg-white dark:bg-zinc-800 text-zinc-600'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Palmtree className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Folga / Dia Bloqueado</span>
                  <span className="text-[10px] opacity-75">Nenhum agendamento permitido</span>
                </div>
              </label>

              <label
                onClick={() => setDayType('custom_hours')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  dayType === 'custom_hours'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                    : 'border-zinc-200 bg-white dark:bg-zinc-800 text-zinc-600'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Trabalho / Horário Especial</span>
                  <span className="text-[10px] opacity-75">Defina horários deste dia</span>
                </div>
              </label>
            </div>

            {dayType === 'day_off' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Motivo da Folga (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Folga, Férias, Consulta, Feriado..."
                  value={dayReason}
                  onChange={(e) => setDayReason(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Início:</span>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Término:</span>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Início Almoço:</span>
                  <input
                    type="time"
                    value={customBreakStart}
                    onChange={(e) => setCustomBreakStart(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Fim Almoço:</span>
                  <input
                    type="time"
                    value={customBreakEnd}
                    onChange={(e) => setCustomBreakEnd(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetDayOverride}
                disabled={isSavingDay}
                className="text-xs font-semibold text-zinc-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restaurar Padrão Semanal</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDayOverride}
                disabled={isSavingDay}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingDay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Salvar para este Dia</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal for Batch Vacation / Range Booking */}
        {isRangeModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Palmtree className="w-5 h-5 text-rose-500" />
                  <span>Programar Folgas em Lote</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsRangeModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Data de Início:
                  </label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Data de Término:
                  </label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Motivo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Férias, Recesso, Folga Coletiva..."
                  value={rangeReason}
                  onChange={(e) => setRangeReason(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRangeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchRange}
                  disabled={isSavingRange}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingRange && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Aplicar Bloqueio em Lote</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
