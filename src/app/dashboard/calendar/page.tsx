'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  User,
  Scissors,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDuration, APPOINTMENT_STATUS_MAP } from '@/lib/utils';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
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

      if (viewMode === 'day') {
        const dStr = format(currentDate, 'yyyy-MM-dd');
        startDateStr = `${dStr}T00:00:00.000Z`;
        endDateStr = `${dStr}T23:59:59.999Z`;
      } else {
        const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
        startDateStr = `${format(startWeek, 'yyyy-MM-dd')}T00:00:00.000Z`;
        endDateStr = `${format(endWeek, 'yyyy-MM-dd')}T23:59:59.999Z`;
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
      setProfessionals(profData.professionals || []);
      setServices(srvData.services || []);
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
    setCurrentDate((prev) => (viewMode === 'day' ? subDays(prev, 1) : subDays(prev, 7)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (viewMode === 'day' ? addDays(prev, 1) : addDays(prev, 7)));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setIsDetailsModalOpen(false);
        await fetchCalendarData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newServiceId || !newDate || !newTime || !newCustomerName || !newCustomerPhone) {
      setFormError('Preencha os campos obrigatórios');
      return;
    }

    setIsSavingNew(true);
    try {
      // Find business ID from a service
      const selectedService = services.find((s) => s.id === newServiceId);
      if (!selectedService) throw new Error('Serviço inválido');

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedService.businessId,
          serviceId: newServiceId,
          professionalId: newProfId || null,
          dateStr: newDate,
          timeStr: newTime,
          customerName: newCustomerName,
          customerPhone: newCustomerPhone,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao agendar horário');
      }

      setIsNewModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewNotes('');
      await fetchCalendarData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar');
    } finally {
      setIsSavingNew(false);
    }
  };

  // Week days
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Agenda e Atendimentos
          </h1>
          <p className="text-xs text-zinc-500 capitalize mt-0.5">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode */}
          <div className="flex p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800">
            <button
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
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Professional Filter (only for admin with multiple professionals) */}
        {professionals.length > 1 && (
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">Todos os Profissionais</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
          <option value="NO_SHOW">Não Compareceu</option>
        </select>
      </div>

      {/* Calendar Grid View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : viewMode === 'day' ? (
        /* DAY VIEW */
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
                onClick={() => setIsNewModalOpen(true)}
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
                        {format(new Date(appt.startTime), 'HH:mm')} -{' '}
                        {format(new Date(appt.endTime), 'HH:mm')}
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
      ) : (
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
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Detalhes do Atendimento"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-xs text-zinc-500">Cliente</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedAppointment.customerName}
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  APPOINTMENT_STATUS_MAP[selectedAppointment.status]?.bg
                }`}
              >
                {APPOINTMENT_STATUS_MAP[selectedAppointment.status]?.label}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Scissors className="w-4 h-4" /> Serviço:
                </span>
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {selectedAppointment.service.name} ({formatDuration(selectedAppointment.service.durationMinutes)})
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <User className="w-4 h-4" /> Profissional:
                </span>
                <strong>{selectedAppointment.professional.name}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="w-4 h-4" /> Data e Horário:
                </span>
                <strong>
                  {format(new Date(selectedAppointment.startTime), "dd/MM/yyyy 'às' HH:mm")}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Phone className="w-4 h-4" /> Telefone / WhatsApp:
                </span>
                <a
                  href={`https://wa.me/55${selectedAppointment.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline font-mono font-bold flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {selectedAppointment.customerPhone}
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                <span className="font-semibold text-zinc-500">Valor Cobrado:</span>
                <span className="font-black text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(selectedAppointment.totalPrice)}
                </span>
              </div>

              {selectedAppointment.notes && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl mt-2">
                  <span className="font-semibold text-zinc-500 block mb-0.5">Observações:</span>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Status Change Buttons */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Alterar Status do Atendimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors cursor-pointer"
                >
                  Não Compareceu
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Manual Appointment Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo Agendamento Manual (Balcão)"
        description="Agende um horário diretamente pelo painel administrativo"
        maxWidth="md"
      >
        <form onSubmit={handleCreateWalkin} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Serviço <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={newServiceId}
              onChange={(e) => setNewServiceId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o serviço...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatDuration(s.durationMinutes)}) - {formatCurrency(s.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Profissional (opcional)
            </label>
            <select
              value={newProfId}
              onChange={(e) => setNewProfId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Qualquer profissional livre</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Horário <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Cliente <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Santana"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Telefone / WhatsApp <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cliente prefere atendimento rápido..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingNew}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSavingNew ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Salvar Agendamento</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

