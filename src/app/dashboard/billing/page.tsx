'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BillingPage() {
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

  const handleSelectPlan = async (planSlug: string) => {
    setIsUpgrading(planSlug);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setSuccessMessage(result.message);
      await fetchBilling();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar plano');
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          Planos e Assinatura do SaaS
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gerencie seu plano, faturamento e capacidade do seu estabelecimento
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current Subscription Status Card */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-zinc-900 to-zinc-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-700">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
              Seu Plano Atual
            </span>
            <h2 className="text-xl font-black mt-0.5">
              {subscription?.plan || 'STARTER'}
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
            {subscription?.status === 'TRIALING' ? 'Período de Teste Grátis' : 'Assinatura Ativa'}
          </span>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700">
            <span className="text-zinc-400 block mb-1">Profissionais Cadastrados:</span>
            <strong className="text-base text-white">{usage.professionalsCount}</strong>
          </div>
          <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700">
            <span className="text-zinc-400 block mb-1">Serviços Criados:</span>
            <strong className="text-base text-white">{usage.servicesCount}</strong>
          </div>
          <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700">
            <span className="text-zinc-400 block mb-1">Agendamentos Totais:</span>
            <strong className="text-base text-white">{usage.appointmentsCount}</strong>
          </div>
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
                onClick={() => handleSelectPlan(plan.slug)}
                disabled={isCurrent || isUpgrading !== null}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-default'
                    : isHighlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                }`}
              >
                {isUpgrading === plan.slug ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  <span>Plano Atual</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Mudar para este Plano</span>
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

