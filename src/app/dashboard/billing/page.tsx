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
  AlertCircle,
  Copy,
  Info,
  X,
  ArrowRight,
  RefreshCw,
  Ban,
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
  const cycleParam = searchParams.get('cycle');
  const methodParam = searchParams.get('method');

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Checkout Modal State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [payerCpf, setPayerCpf] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Cancellation State
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchBilling = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing');
      const result = await res.json();
      setData(result);
      if (result.subscription?.billingCycle) {
        setBillingCycle(result.subscription.billingCycle);
      }
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
        fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: simulatedPlan.toLowerCase(),
            billingCycle: cycleParam || 'MONTHLY',
            paymentMethod: methodParam || 'CREDIT_CARD',
          }),
        }).then(() => {
          setSuccessMessage(
            `Assinatura do Plano ${simulatedPlan} ativada com sucesso via Mercado Pago!`
          );
          fetchBilling();
        });
      } else {
        setSuccessMessage('Pagamento processado com sucesso via Mercado Pago! Sua assinatura está ativa.');
        fetchBilling();
      }
    } else if (paymentStatus === 'pending') {
      setSuccessMessage('Seu pagamento está sendo processado pelo Mercado Pago e será liberado em instantes.');
    }
  }, [paymentStatus, isSimulated, simulatedPlan, cycleParam, methodParam]);

  const handleOpenCheckoutModal = (plan: any) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutResult(null);
    setPayerCpf('');
    setAcceptedTerms(false);
    setPaymentMethod('CREDIT_CARD');
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setIsProcessingCheckout(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: selectedPlanForCheckout.slug,
          billingCycle,
          paymentMethod,
          payerCpf: payerCpf || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao gerar checkout');

      setCheckoutResult(result);

      if (paymentMethod === 'CREDIT_CARD' && result.checkoutUrl) {
        if (result.isSimulated) {
          // Simulation fallback: upgrade and reload
          await fetch('/api/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planSlug: selectedPlanForCheckout.slug,
              billingCycle,
              paymentMethod: 'CREDIT_CARD',
            }),
          });
          setSuccessMessage(
            `Plano ${result.planName} cadastrado com 7 dias de teste grátis! (Simulador)`
          );
          setSelectedPlanForCheckout(null);
          await fetchBilling();
        } else {
          // Real Mercado Pago checkout redirect
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCopyPix = () => {
    if (checkoutResult?.pixQrCodeText) {
      navigator.clipboard.writeText(checkoutResult.pixQrCodeText);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = window.confirm(
      'Tem certeza que deseja cancelar sua assinatura? O cancelamento evitará cobranças automáticas futuras.'
    );
    if (!confirmCancel) return;

    setIsCanceling(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erro ao cancelar');

      alert(resData.message || 'Assinatura cancelada com sucesso.');
      await fetchBilling();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar assinatura');
    } finally {
      setIsCanceling(false);
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
  const isTrial = subscription?.status === 'TRIALING' || !subscription;

  const trialEndsDate = subscription?.trialEndsAt
    ? format(new Date(subscription.trialEndsAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const periodEndDate = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
            Planos & Assinatura
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Escolha seu plano, forma de pagamento e aproveite 7 dias de teste 100% grátis
          </p>
        </div>

        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>7 Dias Grátis • Pagamentos Reais Mercado Pago</span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Missing Token Info for Admin */}
      {data?.hasMercadoPagoToken === false && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Modo de Demonstração Ativo:</strong> Insira seu Access Token do Mercado Pago no painel Super Admin (ou variáveis de ambiente) para processar transações reais instantâneas.
            </span>
          </div>
          <a
            href="/superadmin"
            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 transition-colors shrink-0 text-[11px]"
          >
            Configurar Token
          </a>
        </div>
      )}
      {isTrial && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                Você está no Período de Teste Grátis de 7 Dias!
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                Seu acesso completo está liberado até <strong>{trialEndsDate}</strong>. Efetue o pagamento através do pix ou cartão de crédito antes do término para manter sua página e agendamentos ativos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelSubscription}
            disabled={isCanceling}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 transition-all shrink-0 cursor-pointer self-start sm:self-center"
          >
            {isCanceling ? 'Cancelando...' : 'Cancelar Assinatura'}
          </button>
        </div>
      )}

      {/* Billing Cycle Selector Toggle */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Selecione a Periodicidade do Pagamento
        </span>

        <div className="inline-flex items-center p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'MONTHLY'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Mensal
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('QUARTERLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'QUARTERLY'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Trimestral</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              10% OFF
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'ANNUAL'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Anual</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan: any) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const isPopular = plan.slug === 'pro';

          // Price calculation based on cycle
          let displayPrice = plan.priceMonthly;
          let periodText = '/mês';
          let fullCyclePrice = plan.priceMonthly;
          let economyNote = null;

          if (billingCycle === 'QUARTERLY') {
            fullCyclePrice = plan.priceQuarterly > 0 ? plan.priceQuarterly : plan.priceMonthly * 3 * 0.9;
            displayPrice = fullCyclePrice / 3;
            periodText = '/mês (cobrado R$ ' + fullCyclePrice.toFixed(2) + ' a cada 3 meses)';
            economyNote = 'Economia de 10%';
          } else if (billingCycle === 'ANNUAL') {
            fullCyclePrice = plan.priceAnnual > 0 ? plan.priceAnnual : plan.priceMonthly * 12 * 0.8;
            displayPrice = fullCyclePrice / 12;
            periodText = '/mês (cobrado R$ ' + fullCyclePrice.toFixed(2) + '/ano)';
            economyNote = 'Economia de 20%';
          }

          const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || [];

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all bg-white dark:bg-zinc-900 border ${
                isPopular
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
                  : 'border-zinc-200/80 dark:border-zinc-800 shadow-sm'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                  Mais Escolhido
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {plan.slug === 'starter'
                      ? 'Ideal para profissionais autônomos e pequenos negócios'
                      : plan.slug === 'pro'
                      ? 'Para clínicas, barbearias e escritórios em expansão'
                      : 'Para grandes equipes, redes e operações de alto volume'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">/mês</span>
                  </div>

                  {billingCycle !== 'MONTHLY' && (
                    <div className="text-[11px] text-zinc-500 font-medium">
                      Cobrado {formatCurrency(fullCyclePrice)} {billingCycle === 'QUARTERLY' ? 'trimestralmente' : 'anualmente'}
                    </div>
                  )}

                  {economyNote && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {economyNote}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-1.5 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Profissionais:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {plan.maxProfessionals === 999 ? 'Ilimitados' : plan.maxProfessionals}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Serviços:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {plan.maxServices === 999 ? 'Ilimitados' : plan.maxServices}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Agendamentos:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {plan.maxAppointmentsPerMonth === 9999 ? 'Ilimitados' : `${plan.maxAppointmentsPerMonth}/mês`}
                    </strong>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {features.map((feat: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenCheckoutModal(plan)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      : 'bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Testar 7 Dias Grátis • {plan.name}</span>
                </button>

                <p className="text-[10px] text-center text-zinc-400">
                  Sem cobrança imediata no cartão • Cancele quando quiser
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          CHECKOUT & PAYMENT METHOD MODAL (CARTÃO OU PIX COM 7 DIAS GRÁTIS)
          ======================================================== */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Checkout • TáMarcado
                </span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Plano {selectedPlanForCheckout.name} ({billingCycle === 'MONTHLY' ? 'Mensal' : billingCycle === 'QUARTERLY' ? 'Trimestral' : 'Anual'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Demo Mode, show safety disclaimer instead of real Pix / Card payment */}
            {data?.isDemo ? (
              <div className="text-center space-y-6 py-2 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    <Sparkles className="w-3 h-3" /> Ambiente de Demonstração
                  </span>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    Pagamento Desativado nesta Conta de Teste
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Você está navegando na conta de demonstração pública do <strong>{data?.business?.name || 'TáMarcado'}</strong>.
                    Para sua segurança e para <strong>evitar cobranças acidentais</strong>, a emissão de código Pix e a inserção de cartão de crédito estão desativadas nesta conta demonstrativa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Deseja usar o TáMarcado no seu próprio negócio?</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    Crie sua conta oficial agora mesmo! Você ganha <strong>7 dias de teste grátis</strong>, página de agendamentos personalizada e acesso a todas as funcionalidades.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Criar Minha Conta Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="py-3.5 px-4 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Continuar na Demo
                  </button>
                </div>
              </div>
            ) : checkoutResult?.paymentMethod === 'PIX' && checkoutResult?.pixQrCodeText ? (
              <div className="text-center space-y-5 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-left space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>7 Dias de Teste Grátis Ativados Imediatamente!</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Você pode pagar o Pix de <strong>{formatCurrency(checkoutResult.price)}</strong> a qualquer momento até <strong>{trialEndsDate}</strong> para manter sua assinatura ativa sem interrupções.
                  </p>
                </div>

                {/* QR Code Image */}
                {checkoutResult.pixQrCodeBase64 && (
                  <div className="p-4 bg-white rounded-2xl border border-zinc-200 inline-block shadow-inner mx-auto">
                    <img
                      src={checkoutResult.pixQrCodeBase64}
                      alt="QR Code Pix"
                      className="w-44 h-44 mx-auto"
                    />
                  </div>
                )}

                {/* Copia e Cola */}
                <div className="space-y-2 text-left">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Código Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={checkoutResult.pixQrCodeText}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-[11px] font-mono select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanForCheckout(null);
                      fetchBilling();
                    }}
                    className="w-full py-3 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
                  >
                    Entendido, Voltar ao Painel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessCheckout} className="space-y-5">
                {/* Method Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Escolha a Forma de Pagamento:
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <strong className="block text-xs">Cartão de Crédito</strong>
                      <span className="text-[10px] text-zinc-500 block">
                        R$ 0,00 hoje • Cobrança automática no 7º dia
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <strong className="block text-xs">Pix Copia e Cola</strong>
                      <span className="text-[10px] text-zinc-500 block">
                        7 dias grátis • Pague o Pix até o 7º dia
                      </span>
                    </button>
                  </div>
                </div>

                {/* Important Guarantee Alert */}
                {paymentMethod === 'CREDIT_CARD' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Aviso Importante sobre o Teste Grátis:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      Você <strong>não pagará nada hoje</strong> (R$ 0,00). Ao findar o período de teste grátis de 7 dias (em <strong>{trialEndsDate}</strong>), caso você não efetue o cancelamento no seu painel, a cobrança do plano <strong>{selectedPlanForCheckout.name}</strong> será processada automaticamente no seu cartão cadastrado.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Aviso sobre o Pagamento via Pix:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                      Seus 7 dias de teste grátis serão liberados agora! Um código Pix Copia e Cola será gerado para que você possa efetuar o pagamento do valor integral até o 7º dia e manter sua conta ativa.
                    </p>
                  </div>
                )}

                {/* Caixinha de Concordo com os Termos */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    id="accept_terms_checkout"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-600 cursor-pointer shrink-0"
                  />
                  <label
                    htmlFor="accept_terms_checkout"
                    className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug cursor-pointer select-none"
                  >
                    Concordo com os termos e estou ciente de que, ao findar o período de 7 dias de teste grátis, caso não haja o cancelamento, a cobrança virá automaticamente.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={!acceptedTerms || isProcessingCheckout}
                    className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gerando Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          {paymentMethod === 'CREDIT_CARD'
                            ? 'Cadastrar Cartão & Iniciar 7 Dias Grátis'
                            : 'Gerar Pix & Iniciar 7 Dias Grátis'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
