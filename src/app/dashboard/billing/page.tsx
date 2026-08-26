'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Sparkles,
  QrCode,
  Lock,
  ExternalLink,
  Building2,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('status');
  const isSimulated = searchParams.get('simulated');
  const simulatedPlan = searchParams.get('plan');

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBilling = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  // Handle return from Mercado Pago
  useEffect(() => {
    if (paymentStatus === 'success') {
      if (isSimulated && simulatedPlan) {
        // Apply simulated plan upgrade
        fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug: simulatedPlan.toLowerCase() }),
        }).then(() => {
          setSuccessMessage(
            `Assinatura do Plano ${simulatedPlan} ativada com sucesso via Mercado Pago (Modo Demonstração)!`
          );
          fetchBilling();
        });
      } else {
        setSuccessMessage('Pagamento recebido com sucesso via Mercado Pago! Sua assinatura está ativa.');
        fetchBilling();
      }
    } else if (paymentStatus === 'pending') {
      setSuccessMessage('Seu pagamento via Pix/Boleto está sendo processado pelo Mercado Pago e será liberado em instantes.');
    }
  }, [paymentStatus, isSimulated, simulatedPlan]);

  const handleCheckout = async (planSlug: string) => {
    setIsUpgrading(planSlug);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao gerar checkout');

      if (result.checkoutUrl) {
        if (result.isSimulated) {
          // Simulation fallback: upgrade directly and reload
          await fetch('/api/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planSlug }),
          });
          setSuccessMessage(
            `Plano ${result.planName} ativado com sucesso! (Mercado Pago Simulator)`
          );
          await fetchBilling();
        } else {
          // Real Mercado Pago checkout redirect
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar checkout');
    } finally {
      setIsUpgrading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const subscription = data?.subscription;
  const currentPlanSlug = subscription?.plan?.toLowerCase() || 'starter';
  const plans = data?.plans || [];
  const usage = data?.usage || {};

  const periodEndDate = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Planos e Assinatura do SaaS
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gerencie seu plano, faturamento e capacidade do seu estabelecimento via Mercado Pago
          </p>
        </div>

        {/* Mercado Pago Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-semibold self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-sky-600" />
          <span>Pagamentos Seguros via <strong>Mercado Pago</strong></span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current Subscription Status Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-zinc-900 to-zinc-800 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-700">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
              Seu Plano Atual
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <h2 className="text-2xl font-black text-white">
                Plano {subscription?.plan || 'STARTER'}
              </h2>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {subscription?.status === 'TRIALING' ? '7 Dias Grátis (Teste)' : 'Assinatura Ativa'}
              </span>
            </div>
            {periodEndDate && (
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Próxima renovação em: <strong>{periodEndDate}</strong></span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Processado via Mercado Pago</span>
          </div>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-zinc-800/60 rounded-2xl border border-zinc-700/80 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Profissionais Ativos:</span>
            <p className="text-xl font-bold text-white">{usage.professionalsCount}</p>
          </div>
          <div className="p-4 bg-zinc-800/60 rounded-2xl border border-zinc-700/80 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Serviços Cadastrados:</span>
            <p className="text-xl font-bold text-white">{usage.servicesCount}</p>
          </div>
          <div className="p-4 bg-zinc-800/60 rounded-2xl border border-zinc-700/80 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Agendamentos no Mês:</span>
            <p className="text-xl font-bold text-white">{usage.appointmentsCount}</p>
          </div>
        </div>
      </div>

      {/* Payment methods supported banner */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Formas de pagamento aceitas pelo Mercado Pago:</span>
        </span>
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <QrCode className="w-4 h-4" /> Pix Instantâneo
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
            <CreditCard className="w-4 h-4" /> Cartão de Crédito
          </span>
          <span>•</span>
          <span>Boleto Bancário</span>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan: any) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const isHighlight = plan.slug === 'pro';

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                isHighlight
                  ? 'border-blue-500 bg-white dark:bg-zinc-900 ring-2 ring-blue-500 shadow-xl'
                  : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {plan.name}
                  </h3>
                  {isHighlight && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      Mais Popular
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(plan.priceMonthly)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">/mês</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Incluso no plano:
                  </span>
                  {plan.features?.map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCheckout(plan.slug)}
                disabled={isCurrent || isUpgrading !== null}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isCurrent
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-default shadow-none'
                    : isHighlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                }`}
              >
                {isUpgrading === plan.slug ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  <span>Plano Atual Ativo</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Assinar via Mercado Pago</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
