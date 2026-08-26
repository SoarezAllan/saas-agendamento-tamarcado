'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  User,
  Users,
  Scissors,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDuration, APPOINTMENT_STATUS_MAP } from '@/lib/utils';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'team' | 'day' | 'week' | 'month'>('team');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Appointment Form State
  const [newServiceId, setNewServiceId] = useState('');
  const [newProfId, setNewProfId] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState('10:00');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      let startDateStr: string;
      let endDateStr: string;

      if (viewMode === 'day' || viewMode === 'team') {
        const dStr = format(currentDate, 'yyyy-MM-dd');
        startDateStr = `${dStr}T00:00:00.000Z`;
        endDateStr = `${dStr}T23:59:59.999Z`;
      } else if (viewMode === 'week') {
        const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
        startDateStr = `${format(startWeek, 'yyyy-MM-dd')}T00:00:00.000Z`;
        endDateStr = `${format(endWeek, 'yyyy-MM-dd')}T23:59:59.999Z`;
      } else {
        // month view
        const startMonth = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        const endMonth = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
        startDateStr = `${format(startMonth, 'yyyy-MM-dd')}T00:00:00.000Z`;
        endDateStr = `${format(endMonth, 'yyyy-MM-dd')}T23:59:59.999Z`;
      }

      const profQuery = selectedProfFilter !== 'all' ? `&professionalId=${selectedProfFilter}` : '';
      const statusQuery = selectedStatusFilter !== 'all' ? `&status=${selectedStatusFilter}` : '';

      const [apptRes, profRes, srvRes] = await Promise.all([
        fetch(`/api/appointments?startDate=${startDateStr}&endDate=${endDateStr}${profQuery}${statusQuery}`),
        fetch('/api/professionals'),
        fetch('/api/services'),
      ]);

      const [apptData, profData, srvData] = await Promise.all([
        apptRes.json(),
        profRes.json(),
        srvRes.json(),
      ]);

      setAppointments(apptData.appointments || []);
      const profsList = profData.professionals || [];
      setProfessionals(profsList);
      setServices(srvData.services || []);

      // If single professional (e.g. employee account), default to day view if preferred
      if (profsList.length === 1 && viewMode === 'team') {
        setViewMode('day');
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode, selectedProfFilter, selectedStatusFilter]);

  const handlePrev = () => {
    if (viewMode === 'day' || viewMode === 'team') {
      setCurrentDate((prev) => subDays(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day' || viewMode === 'team') {
      setCurrentDate((prev) => addDays(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenNewWithProf = (profId?: string) => {
    setNewProfId(profId || professionals[0]?.id || '');
    setNewDate(format(currentDate, 'yyyy-MM-dd'));
    setNewServiceId(services[0]?.id || '');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewNotes('');
    setFormError(null);
    setIsNewModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar status');
      await fetchCalendarData();

      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do agendamento');
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSavingNew(true);

    try {
      const selectedService = services.find((s) => s.id === newServiceId);
      const duration = selectedService?.durationMinutes || 30;

      const [year, month, day] = newDate.split('-').map(Number);
      const [hour, minute] = newTime.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, hour, minute, 0);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

      const payload = {
        serviceId: newServiceId,
        professionalId: newProfId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim(),
        notes: newNotes.trim() || undefined,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar agendamento');

      setIsNewModalOpen(false);
      await fetchCalendarData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar agendamento');
    } finally {
      setIsSavingNew(false);
    }
  };

  const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startWeek, end: endWeek });

  // Month interval
  const monthGridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const monthGridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd });

  const displayedProfessionals =
    selectedProfFilter === 'all'
      ? professionals
      : professionals.filter((p) => p.id === selectedProfFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            <span>Agenda & Atendimentos</span>
          </h1>
          <p className="text-xs text-zinc-500 capitalize mt-0.5">
            {viewMode === 'month'
              ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
              : viewMode === 'week'
              ? `Semana de ${format(startWeek, 'dd/MM')} a ${format(endWeek, 'dd/MM/yyyy')}`
              : format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Selector */}
          <div className="flex p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800">
            {professionals.length > 1 && (
              <button
                type="button"
                onClick={() => setViewMode('team')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'team'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
                title="Visualizar agenda de todos os profissionais lado a lado"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equipe (Todos)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Mês
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            type="button"
            onClick={() => handleOpenNewWithProf()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Professional Filter (only for admin with multiple professionals) */}
        {professionals.length > 1 && (
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
          >
            <option value="all">👥 Todos os Profissionais ({professionals.length})</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                👤 {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
        >
          <option value="all">Todos os Status</option>
          <option value="PENDING">Pendentes</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="COMPLETED">Concluídos</option>
          <option value="CANCELLED">Cancelados</option>
        </select>

        <span className="text-xs font-semibold text-zinc-500 ml-auto">
          {appointments.length} agendamento(s) no período
        </span>
      </div>

      {/* Main Views Render */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : viewMode === 'team' ? (
        /* ========================================================
           TEAM MULTI-COLUMN VIEW (GRADE COM TODOS OS PROFISSIONAIS)
           ======================================================== */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 capitalize">
                Grade de Atendimentos da Equipe • {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Visualização simultânea de todos os colaboradores para o dia selecionado
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl">
              {displayedProfessionals.length} Colaboradores
            </span>
          </div>

          <div className="grid gap-4 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${Math.max(displayedProfessionals.length, 1)}, minmax(280px, 1fr))` }}>
            {displayedProfessionals.map((prof) => {
              const profAppts = appointments.filter((a) => a.professionalId === prof.id);

              return (
                <div
                  key={prof.id}
                  className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 flex flex-col justify-between overflow-hidden shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                        {prof.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prof.avatarUrl} alt={prof.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {prof.name}
                        </h3>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {prof.services?.length || 0} serviços
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                      {profAppts.length}
                    </span>
                  </div>

                  {/* Appointments List for this professional */}
                  <div className="p-3 space-y-2.5 flex-1 min-h-72 max-h-[60vh] overflow-y-auto">
                    {profAppts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
                        <Clock className="w-6 h-6 opacity-40" />
                        <span className="text-xs">Nenhum agendamento hoje</span>
                        <button
                          type="button"
                          onClick={() => handleOpenNewWithProf(prof.id)}
                          className="text-[11px] font-bold text-blue-600 hover:underline pt-1 cursor-pointer"
                        >
                          + Agendar Cliente
                        </button>
                      </div>
                    ) : (
                      profAppts.map((appt) => {
                        const statusCfg = APPOINTMENT_STATUS_MAP[appt.status] || {
                          label: appt.status,
                          bg: 'bg-zinc-100 text-zinc-800',
                        };

                        return (
                          <div
                            key={appt.id}
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-mono font-bold">
                                {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                              </span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${statusCfg.bg}`}>
                                {statusCfg.label}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                                {appt.customerName}
                              </h4>
                              <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{appt.customerPhone}</span>
                              </p>
                            </div>

                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-36">
                                {appt.service.name}
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(appt.totalPrice)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Column Bottom Action */}
                  <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenNewWithProf(prof.id)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agendar para {prof.name.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'day' ? (
        /* DAY VIEW (INDIVIDUAL CARDS) */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize">
              {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <span className="text-xs font-semibold text-zinc-500">
              {appointments.length} agendamento(s)
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Nenhum agendamento para este dia
              </p>
              <button
                onClick={() => handleOpenNewWithProf()}
                className="mt-3 text-xs text-blue-600 font-bold hover:underline"
              >
                + Fazer agendamento manual
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appt) => {
                const statusCfg = APPOINTMENT_STATUS_MAP[appt.status] || {
                  label: appt.status,
                  bg: 'bg-zinc-100 text-zinc-800',
                };

                return (
                  <div
                    key={appt.id}
                    onClick={() => {
                      setSelectedAppointment(appt);
                      setIsDetailsModalOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 bg-zinc-50/50 dark:bg-zinc-900/60 transition-all cursor-pointer shadow-xs hover:shadow-md group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold">
                        {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                        {appt.customerName}
                      </h4>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {appt.customerPhone}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="truncate">{appt.service.name}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                        {formatCurrency(appt.totalPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{appt.professional.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : viewMode === 'week' ? (
        /* WEEK VIEW */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {weekDays.map((dayDate) => {
              const dayAppts = appointments.filter((a) =>
                isSameDay(new Date(a.startTime), dayDate)
              );
              const isCurrentDay = isToday(dayDate);

              return (
                <div
                  key={dayDate.toISOString()}
                  className={`p-3 rounded-2xl border flex flex-col min-h-[350px] ${
                    isCurrentDay
                      ? 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800 mb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block">
                      {format(dayDate, 'EEE', { locale: ptBR })}
                    </span>
                    <span
                      className={`text-sm font-bold inline-block px-2 py-0.5 rounded-full mt-0.5 ${
                        isCurrentDay ? 'bg-blue-600 text-white' : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {format(dayDate, 'dd')}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayAppts.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-zinc-400">
                        Livre
                      </div>
                    ) : (
                      dayAppts.map((appt) => {
                        const statusCfg = APPOINTMENT_STATUS_MAP[appt.status] || {
                          bg: 'bg-zinc-100 text-zinc-800',
                        };

                        return (
                          <div
                            key={appt.id}
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-xs shadow-2xs hover:border-blue-500 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                              <span>{format(new Date(appt.startTime), 'HH:mm')}</span>
                              <span className={`w-2 h-2 rounded-full ${statusCfg.bg}`} />
                            </div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate mt-1">
                              {appt.customerName}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {appt.service.name}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MONTH VIEW (CALENDÁRIO COMPLETO COM TODOS OS AGENDAMENTOS) */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="grid grid-cols-7 text-center font-bold text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/80 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            {monthDays.map((day) => {
              const inCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDay = isToday(day);
              const dayAppts = appointments.filter((a) =>
                isSameDay(new Date(a.startTime), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode(professionals.length > 1 ? 'team' : 'day');
                  }}
                  className={`min-h-24 p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                    !inCurrentMonth ? 'opacity-30 bg-zinc-50/50 dark:bg-zinc-900/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isTodayDay
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 truncate text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        {format(new Date(a.startTime), 'HH:mm')} {a.customerName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <span className="text-[9px] text-zinc-400 font-semibold block">
                        +{dayAppts.length - 2} outros
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Detalhes do Agendamento"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700">
              <div>
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Status Atual
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    APPOINTMENT_STATUS_MAP[selectedAppointment.status]?.bg || 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  {APPOINTMENT_STATUS_MAP[selectedAppointment.status]?.label || selectedAppointment.status}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Valor Total
                </span>
                <span className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
                  {formatCurrency(selectedAppointment.totalPrice)}
                </span>
              </div>
            </div>

            {/* Client info */}
            <div className="space-y-2 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cliente</h4>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {selectedAppointment.customerName}
              </p>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{selectedAppointment.customerPhone}</span>
              </p>
            </div>

            {/* Service & Professional */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium uppercase block">Serviço</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                  {selectedAppointment.service.name}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {formatDuration(selectedAppointment.service.durationMinutes)}
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium uppercase block">Profissional</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                  {selectedAppointment.professional.name}
                </span>
              </div>
            </div>

            {/* Change Status Actions */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-500 block">Alterar Status:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')}
                  className="p-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                  className="p-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 transition-colors cursor-pointer"
                >
                  Concluir
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                  className="p-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Appointment Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo Agendamento Manual"
        description="Lance um agendamento feito por WhatsApp, telefone ou presencialmente"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Serviço *
              </label>
              <select
                required
                value={newServiceId}
                onChange={(e) => setNewServiceId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Profissional *
              </label>
              <select
                required
                value={newProfId}
                onChange={(e) => setNewProfId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Horário de Início *
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                WhatsApp do Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="(81) 99999-9999"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Preferência por corte com tesoura"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingNew}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingNew && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Criar Agendamento</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
