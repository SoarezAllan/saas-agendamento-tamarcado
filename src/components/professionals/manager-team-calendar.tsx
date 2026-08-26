'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  Palmtree,
  Sun,
  User,
  Users,
  Filter,
  Loader2,
  CalendarCheck,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ManagerTeamCalendarProps {
  professionals: any[];
  userRole?: string;
  onRefresh?: () => void;
}

export function ManagerTeamCalendar({
  professionals,
  userRole = 'ADMIN',
  onRefresh,
}: ManagerTeamCalendarProps) {
  const isProfessionalUser = userRole === 'PROFESSIONAL';
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedProfId, setSelectedProfId] = useState<string>(
    isProfessionalUser && professionals[0]?.id ? professionals[0].id : 'all'
  );
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Day Edit Popover/Modal
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editProfId, setEditProfId] = useState<string>(professionals[0]?.id || '');
  const [dayType, setDayType] = useState<'day_off' | 'custom_hours'>('day_off');
  const [dayReason, setDayReason] = useState('Folga');
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('18:00');
  const [customBreakStart, setCustomBreakStart] = useState('12:00');
  const [customBreakEnd, setCustomBreakEnd] = useState('13:00');
  const [isSavingDay, setIsSavingDay] = useState(false);

  // Batch Range Modal
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeProfId, setRangeProfId] = useState<string>(professionals[0]?.id || '');
  const [rangeStartDate, setRangeStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rangeEndDate, setRangeEndDate] = useState(
    format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [rangeReason, setRangeReason] = useState('Férias Programadas');
  const [isSavingRange, setIsSavingRange] = useState(false);

  const fetchAllOverrides = async () => {
    setIsLoading(true);
    try {
      const monthStart = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
      const monthEnd = format(endOfWeek(endOfMonth(addMonths(currentMonth, 1))), 'yyyy-MM-dd');

      const url =
        selectedProfId !== 'all'
          ? `/api/professionals/overrides?professionalId=${selectedProfId}&startDate=${monthStart}&endDate=${monthEnd}`
          : `/api/professionals/overrides?startDate=${monthStart}&endDate=${monthEnd}`;

      const res = await fetch(url);
      const data = await res.json();
      setOverrides(data.overrides || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOverrides();
  }, [currentMonth, selectedProfId]);

  useEffect(() => {
    if (isProfessionalUser && professionals[0]?.id) {
      setSelectedProfId(professionals[0].id);
      setEditProfId(professionals[0].id);
      setRangeProfId(professionals[0].id);
    }
  }, [professionals, isProfessionalUser]);

  // Calendar dates calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getProfStatusForDay = (prof: any, day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();

    const override = overrides.find(
      (o) => o.professionalId === prof.id && o.date === dateStr
    );

    if (override) {
      if (!override.isAvailable) {
        return {
          type: 'override_off',
          label: override.reason || 'Folga',
          isWorking: false,
          color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          override,
        };
      } else {
        return {
          type: 'override_work',
          label: `${override.startTime || '09:00'}-${override.endTime || '18:00'}`,
          isWorking: true,
          color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          override,
        };
      }
    }

    const weeklyAvail = prof.availabilities?.find((a: any) => a.dayOfWeek === dayOfWeek);
    if (weeklyAvail && !weeklyAvail.isAvailable) {
      return {
        type: 'weekly_off',
        label: 'Folga Semanal',
        isWorking: false,
        color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700',
      };
    }

    const startTime = weeklyAvail?.startTime || '09:00';
    const endTime = weeklyAvail?.endTime || '18:00';
    return {
      type: 'weekly_work',
      label: `${startTime}-${endTime}`,
      isWorking: true,
      color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      startTime,
      endTime,
    };
  };

  const handleOpenDayEdit = (day: Date, prof: any) => {
    setSelectedDay(day);
    setEditProfId(prof.id);
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = overrides.find(
      (o) => o.professionalId === prof.id && o.date === dateStr
    );

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
      const status = getProfStatusForDay(prof, day);
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
    if (!selectedDay || !editProfId) return;
    setIsSavingDay(true);
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      await fetch('/api/professionals/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: editProfId,
          date: dateStr,
          isAvailable: dayType === 'custom_hours',
          reason: dayReason,
          startTime: customStartTime,
          endTime: customEndTime,
          breakStart: customBreakStart,
          breakEnd: customBreakEnd,
        }),
      });

      await fetchAllOverrides();
      setSelectedDay(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alteração do dia');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleResetDayOverride = async () => {
    if (!selectedDay || !editProfId) return;
    setIsSavingDay(true);
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      await fetch(
        `/api/professionals/overrides?professionalId=${editProfId}&date=${dateStr}`,
        { method: 'DELETE' }
      );

      await fetchAllOverrides();
      setSelectedDay(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar dia');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleSaveBatchRange = async () => {
    if (!rangeProfId) return;
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
          professionalId: rangeProfId,
          dates: targetDates,
          isAvailable: false,
          reason: rangeReason || 'Férias Programadas',
        }),
      });

      await fetchAllOverrides();
      setIsRangeModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao aplicar folga em lote');
    } finally {
      setIsSavingRange(false);
    }
  };

  const displayedProfessionals =
    selectedProfId === 'all'
      ? professionals
      : professionals.filter((p) => p.id === selectedProfId);

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-44">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 capitalize flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              {isLoading ? 'Carregando escalas...' : `${overrides.length} exceções e folgas no período`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {!isProfessionalUser && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Colaborador:
              </span>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">👥 Todos os Colaboradores ({professionals.length})</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            Mês Atual
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(new Date(), 1))}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
          >
            Próximo Mês
          </button>
          <button
            type="button"
            onClick={() => setIsRangeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Palmtree className="w-3.5 h-3.5" />
            <span>Programar Férias / Bloqueio em Lote</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-2 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
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

        <span className="text-[11px] text-zinc-400">
          💡 Clique em qualquer colaborador dentro do dia para alterar seu horário ou marcar folga.
        </span>
      </div>

      {/* Main Calendar View Grid */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center text-xs font-bold text-zinc-600 dark:text-zinc-400 py-3">
          {weekDayNames.map((d, i) => (
            <span key={d} className={i === 0 || i === 6 ? 'text-rose-500' : ''}>
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {calendarDays.map((day) => {
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');

            return (
              <div
                key={dateStr}
                className={`min-h-36 p-2 flex flex-col justify-between transition-colors ${
                  !inCurrentMonth ? 'opacity-30 bg-zinc-50/50 dark:bg-zinc-900/30' : 'bg-white dark:bg-zinc-950'
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between pb-1">
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
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {format(day, 'dd/MM')}
                  </span>
                </div>

                {/* List of professionals and their shifts on this day */}
                <div className="space-y-1.5 my-1 overflow-y-auto max-h-32 pr-0.5">
                  {displayedProfessionals.map((prof) => {
                    const status = getProfStatusForDay(prof, day);

                    return (
                      <div
                        key={prof.id}
                        onClick={() => handleOpenDayEdit(day, prof)}
                        className={`p-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-2xs flex items-center justify-between gap-1.5 ${status.color}`}
                        title={`Clique para editar a escala de ${prof.name} neste dia`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="w-4 h-4 rounded-md bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 text-[9px] font-black">
                            {prof.name[0]}
                          </div>
                          <span className="truncate">{prof.name.split(' ')[0]}</span>
                        </div>
                        <span className="text-[10px] shrink-0 font-medium">
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom hint */}
                <div className="text-right">
                  <span className="text-[9px] text-zinc-400 opacity-60">
                    {displayedProfessionals.length} prof.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Quick Editor Drawer/Card */}
      {selectedDay && (
        <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 capitalize">
                  Editar Escala: {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Colaborador:{' '}
                  <strong>{professionals.find((p) => p.id === editProfId)?.name || 'Profissional'}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-xl bg-white/60 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              onClick={() => setDayType('day_off')}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                dayType === 'day_off'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-zinc-200 bg-white dark:bg-zinc-800 text-zinc-600'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Palmtree className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Folga / Dia Bloqueado</span>
                <span className="text-[10px] opacity-75">Nenhum agendamento permitido para este dia</span>
              </div>
            </label>

            <label
              onClick={() => setDayType('custom_hours')}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                dayType === 'custom_hours'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-zinc-200 bg-white dark:bg-zinc-800 text-zinc-600'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Trabalho / Horário Especial</span>
                <span className="text-[10px] opacity-75">Defina horários de plantão ou turnos extras</span>
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
                placeholder="Ex: Folga, Férias, Recesso, Consulta Médica..."
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingDay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Salvar Alteração para este Dia</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Range Vacation Modal */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-rose-500" />
                <span>Programar Folgas em Lote / Férias</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsRangeModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isProfessionalUser && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Selecione o Colaborador:
                </label>
                <select
                  value={rangeProfId}
                  onChange={(e) => setRangeProfId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-xs font-bold"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <span>Aplicar Bloqueio no Período</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

