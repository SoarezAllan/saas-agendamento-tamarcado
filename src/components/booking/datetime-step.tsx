'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sun,
  Sunset,
  Moon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  format,
  addDays,
  isSameDay,
  isBefore,
  startOfToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AvailableSlot {
  time: string;
  endTime: string;
  period: 'morning' | 'afternoon' | 'evening';
  availableProfessionalIds: string[];
  suggestedProfessionalId: string;
}

interface DateTimeStepProps {
  businessId: string;
  serviceId: string;
  professionalId: string | null;
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string | null; // "09:00"
  onSelectDateTime: (date: string, time: string) => void;
  primaryColor?: string;
}

export function DateTimeStep({
  businessId,
  serviceId,
  professionalId,
  selectedDate,
  selectedTime,
  onSelectDateTime,
  primaryColor = '#2563eb',
}: DateTimeStepProps) {
  const today = startOfToday();
  const [currentDateObj, setCurrentDateObj] = useState<Date>(
    selectedDate ? new Date(`${selectedDate}T00:00:00`) : today
  );
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isOpenDay, setIsOpenDay] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Next 14 quick days
  const quickDays = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  // Fetch slots whenever selectedDate or professionalId changes
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorMessage(null);
      try {
        const dateStr = format(currentDateObj, 'yyyy-MM-dd');
        const profQuery =
          professionalId && professionalId !== 'any' ? `&professionalId=${professionalId}` : '';
        const res = await fetch(
          `/api/availability?businessId=${businessId}&serviceId=${serviceId}&date=${dateStr}${profQuery}`
        );
        const data = await res.json();

        if (res.ok) {
          setIsOpenDay(data.isOpen !== false);
          setSlots(data.slots || []);
          if (!data.isOpen) {
            setErrorMessage(data.message || 'Estabelecimento fechado nesta data');
          } else if (data.slots && data.slots.length === 0) {
            setErrorMessage(data.message || 'Nenhum horário disponível para esta data');
          }
        } else {
          setErrorMessage(data.error || 'Erro ao carregar horários');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Falha ao conectar com o servidor');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [businessId, serviceId, professionalId, currentDateObj]);

  const handleSelectDay = (date: Date) => {
    setCurrentDateObj(date);
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    const dateStr = format(currentDateObj, 'yyyy-MM-dd');
    onSelectDateTime(dateStr, slot.time);
  };

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const afternoonSlots = slots.filter((s) => s.period === 'afternoon');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Data e Horário
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Escolha o melhor dia e horário para o seu atendimento
        </p>
      </div>

      {/* Quick Horizontal Date Carousel */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Selecione o Dia
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {quickDays.map((dayDate) => {
            const isSelected = isSameDay(dayDate, currentDateObj);
            const isTodayDate = isSameDay(dayDate, today);
            const dayOfWeekName = format(dayDate, 'EEE', { locale: ptBR });
            const dayNumber = format(dayDate, 'dd');
            const monthName = format(dayDate, 'MMM', { locale: ptBR });

            return (
              <button
                key={dayDate.toISOString()}
                type="button"
                onClick={() => handleSelectDay(dayDate)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[70px] border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-transparent text-white shadow-md scale-105'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
                style={{
                  backgroundColor: isSelected ? primaryColor : undefined,
                }}
              >
                <span className="text-[11px] font-medium capitalize opacity-80">
                  {dayOfWeekName}
                </span>
                <span className="text-lg font-bold my-0.5">{dayNumber}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                  {isTodayDate ? 'Hoje' : monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Indicator */}
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
        <CalendarIcon className="w-4 h-4 text-zinc-500" />
        <span>
          Horários para:{' '}
          <strong className="text-zinc-900 dark:text-zinc-100 capitalize">
            {format(currentDateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </strong>
        </span>
      </div>

      {/* Time Slots Section */}
      <div className="space-y-4">
        {isLoadingSlots ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Consultando disponibilidade em tempo real...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {errorMessage || 'Nenhum horário livre'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Tente selecionar outro dia no calendário acima ou escolher outro profissional.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning Slots */}
            {morningSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Manhã</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {morningSlots.map((slot) => {
                    const isSelected =
                      selectedTime === slot.time &&
                      selectedDate === format(currentDateObj, 'yyyy-MM-dd');

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-transparent text-white shadow-md ring-2 ring-offset-1'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 hover:shadow-xs'
                        }`}
                        style={{
                          backgroundColor: isSelected ? primaryColor : undefined,
                          borderColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {afternoonSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Sunset className="w-4 h-4 text-orange-500" />
                  <span>Tarde</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isSelected =
                      selectedTime === slot.time &&
                      selectedDate === format(currentDateObj, 'yyyy-MM-dd');

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-transparent text-white shadow-md ring-2 ring-offset-1'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 hover:shadow-xs'
                        }`}
                        style={{
                          backgroundColor: isSelected ? primaryColor : undefined,
                          borderColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evening Slots */}
            {eveningSlots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Noite</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {eveningSlots.map((slot) => {
                    const isSelected =
                      selectedTime === slot.time &&
                      selectedDate === format(currentDateObj, 'yyyy-MM-dd');

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-transparent text-white shadow-md ring-2 ring-offset-1'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 hover:shadow-xs'
                        }`}
                        style={{
                          backgroundColor: isSelected ? primaryColor : undefined,
                          borderColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

