'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Calendar, Clock, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const collectionStatus = searchParams.get('collection_status') || searchParams.get('status');

  useEffect(() => {
    // Confirm payment and fetch updated subscription
    const confirm = async () => {
      try {
        const res = await fetch('/api/billing/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            collectionStatus,
            collectionId: searchParams.get('collection_id'),
            merchantOrderId: searchParams.get('merchant_order_id'),
            preferenceId: searchParams.get('preference_id'),
            externalReference: searchParams.get('external_reference'),
            planSlug: searchParams.get('plan'),
            billingCycle: searchParams.get('cycle'),
          }),
        });
        const resData = await res.json();
        setData(resData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsVerifying(false);
      }
    };

    confirm();
  }, [paymentId, collectionStatus, searchParams]);

  useEffect(() => {
    if (data?.success || data?.subscription) {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-18409831535',
          value: Number(data.subscription?.price || 49.9),
          currency: 'BRL',
          transaction_id: paymentId || String(Date.now()),
        });
      }
    }
  }, [data, paymentId]);

  const subscription = data?.subscription;
  const periodEndDate = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 space-y-6 text-center shadow-xl">
        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 text-white rounded-full shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Compra Confirmada
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
            Assinatura Ativada!
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Seu pagamento foi confirmado pelo Mercado Pago e todos os recursos do TáMarcado já estão 100% liberados para seu negócio.
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Status da Conta:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Ativa & Liberada
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Plano:</span>
            <strong className="text-zinc-800 dark:text-zinc-200">
              Plano {subscription?.plan || 'Contratado'}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Válido até:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {periodEndDate}
            </strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-3.5 px-5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ir para o Meu Painel</span>
          </Link>

          <Link
            href="/dashboard/billing"
            className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors block"
          >
            Ver Detalhes da Assinatura
          </Link>
        </div>
      </div>
    </div>
  );
}

