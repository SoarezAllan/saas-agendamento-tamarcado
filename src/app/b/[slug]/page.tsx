'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Scissors,
  User,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ServiceStep } from '@/components/booking/service-step';
import { ProfessionalStep } from '@/components/booking/professional-step';
import { DateTimeStep } from '@/components/booking/datetime-step';
import { CustomerStep } from '@/components/booking/customer-step';
import { ConfirmationStep } from '@/components/booking/confirmation-step';
import { DemoBanner } from '@/components/ui/demo-banner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { format } from 'date-fns';

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  serviceTerm?: string | null;
  proTerm?: string | null;
  services: any[];
  professionals: any[];
  businessHours: any[];
}

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>('any');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<any | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/business/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Estabelecimento não encontrado');
          } else {
            setError('Erro ao carregar dados');
          }
          return;
        }
        const data = await res.json();
        setBusiness(data.business);
      } catch (err) {
        console.error(err);
        setError('Erro de conexão');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-zinc-500">Carregando página de agendamento...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
          <Scissors className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {error || 'Estabelecimento não encontrado'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm">
          Verifique o link digitado ou entre em contato diretamente com o estabelecimento.
        </p>
      </div>
    );
  }

  const primaryColor = business.primaryColor || '#2563eb';

  // Step 1 -> Step 2
  const handleSelectService = (service: any) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  // Step 2 -> Step 3
  const handleSelectProfessional = (profId: string | 'any') => {
    setSelectedProfessionalId(profId);
    setCurrentStep(3);
  };

  // Step 3 -> Step 4
  const handleSelectDateTime = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep(4);
  };

  // Final Submit
  const handleFinalSubmit = async (customerData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          professionalId: selectedProfessionalId === 'any' ? null : selectedProfessionalId,
          dateStr: selectedDate,
          timeStr: selectedTime,
          ...customerData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao confirmar agendamento');
      }

      setConfirmedBookingData(data);
      setCurrentStep(5);
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewBooking = () => {
    setSelectedService(null);
    setSelectedProfessionalId('any');
    setSelectedTime(null);
    setConfirmedBookingData(null);
    setCurrentStep(1);
  };

  const selectedProfessionalObj =
    selectedProfessionalId === 'any' || !selectedProfessionalId
      ? { name: 'Qualquer profissional disponível' }
      : business.professionals.find((p) => p.id === selectedProfessionalId) || {
          name: 'Profissional',
        };

  const isDemoSlug = [
    'barbearia-vintage',
    'clinica-estetica-glow',
    'dr-odonto',
    'albuquerque-advogados',
    'vanguarda-arquitetura',
  ].includes(slug);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Demo Mode Notice Banner */}
      {isDemoSlug && <DemoBanner businessName={business.name} />}

      {/* Background Accent Gradient */}
      <div
        className="h-44 w-full absolute top-0 left-0 opacity-15 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${primaryColor}, transparent 70%)`,
        }}
      />

      <div className="relative w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Top Controls: Theme Toggle, Area do Cliente & Demo indicator */}
        <div className="flex items-center justify-between mb-3 px-1">
          {isDemoSlug ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3.5 h-3.5" /> Estabelecimento de Demonstração
            </span>
          ) : (
            <Link
              href="/cliente/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Área do Cliente</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {isDemoSlug && (
              <Link
                href="/cliente/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
              >
                <User className="w-3 h-3 text-blue-600" />
                <span>Área do Cliente</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0 overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                business.name[0].toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {business.category}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                {business.name}
              </h1>
              {business.address && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  {business.address}
                </p>
              )}
            </div>
          </div>

          {business.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {business.description}
            </p>
          )}

          {/* Stepper Bar (if not finished) */}
          {currentStep <= 4 && (
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                <span className={currentStep >= 1 ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                  1. Serviço
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-300" />
                <span className={currentStep >= 2 ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                  2. Profissional
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-300" />
                <span className={currentStep >= 3 ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                  3. Horário
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-300" />
                <span className={currentStep >= 4 ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                  4. Confirmar
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    backgroundColor: primaryColor,
                    width: `${(currentStep / 4) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800">
          {/* Back button if > 1 and < 5 */}
          {currentStep > 1 && currentStep < 5 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar etapa anterior</span>
            </button>
          )}

          {/* Steps */}
          {currentStep === 1 && (
            <ServiceStep
              services={business.services}
              selectedService={selectedService}
              onSelectService={handleSelectService}
              primaryColor={primaryColor}
              businessPhone={business.phone}
              businessName={business.name}
            />
          )}

          {currentStep === 2 && selectedService && (
            <ProfessionalStep
              professionals={business.professionals}
              selectedProfessionalId={selectedProfessionalId}
              onSelectProfessional={handleSelectProfessional}
              serviceId={selectedService.id}
              primaryColor={primaryColor}
            />
          )}

          {currentStep === 3 && selectedService && (
            <DateTimeStep
              businessId={business.id}
              serviceId={selectedService.id}
              professionalId={selectedProfessionalId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDateTime={handleSelectDateTime}
              primaryColor={primaryColor}
            />
          )}

          {currentStep === 4 && selectedService && selectedTime && (
            <CustomerStep
              service={selectedService}
              professionalName={selectedProfessionalObj.name}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
              primaryColor={primaryColor}
            />
          )}

          {currentStep === 5 && confirmedBookingData && (
            <ConfirmationStep
              business={business}
              appointment={confirmedBookingData.appointment}
              links={confirmedBookingData.links}
              onNewBooking={handleNewBooking}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </div>

      {/* Public Footer */}
      <footer className="py-6 text-center text-xs text-zinc-400">
        <div className="flex items-center justify-center gap-2">
          <span>Agendamento Online powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Tá Marcado"
            className="h-5 w-auto object-contain inline-block dark:bg-white dark:rounded-md dark:px-1"
          />
        </div>
      </footer>
    </div>
  );
}

