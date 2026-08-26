'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Calendar,
  Users,
  ExternalLink,
  Loader2,
  ArrowLeft,
  CreditCard,
  QrCode,
  Lock,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  Sliders,
  RefreshCw,
  PlusCircle,
  Settings,
  DollarSign,
  Briefcase,
  Clock,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'mercadopago' | 'businesses' | 'plans' | 'settings'>('overview');

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    MERCADO_PAGO_ACCESS_TOKEN: '',
    MERCADO_PAGO_PUBLIC_KEY: '',
    MERCADO_PAGO_ENVIRONMENT: 'production',
    PLATFORM_NAME: 'TáMarcado',
    TRIAL_DAYS: '7',
    SUPPORT_WHATSAPP: '',
    SUPPORT_EMAIL: '',
  });

  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mpTestResult, setMpTestResult] = useState<any | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Business management modal state
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [managePlan, setManagePlan] = useState('');
  const [manageStatus, setManageStatus] = useState('');
  const [extendDays, setExtendDays] = useState('30');
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  const [businessSearch, setBusinessSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const fetchSuperAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/superadmin');
      if (!res.ok) {
        setError('Acesso negado. Apenas o Super Admin tem permissão para visualizar este painel.');
        return;
      }
      const result = await res.json();
      setData(result);

      if (result.settings) {
        setSettingsForm({
          MERCADO_PAGO_ACCESS_TOKEN: result.settings.MERCADO_PAGO_ACCESS_TOKEN || '',
          MERCADO_PAGO_PUBLIC_KEY: result.settings.MERCADO_PAGO_PUBLIC_KEY || '',
          MERCADO_PAGO_ENVIRONMENT: result.settings.MERCADO_PAGO_ENVIRONMENT || 'production',
          PLATFORM_NAME: result.settings.PLATFORM_NAME || 'TáMarcado',
          TRIAL_DAYS: result.settings.TRIAL_DAYS || '7',
          SUPPORT_WHATSAPP: result.settings.SUPPORT_WHATSAPP || '',
          SUPPORT_EMAIL: result.settings.SUPPORT_EMAIL || '',
        });
      }

      if (result.mercadoPagoStatus) {
        setMpTestResult(result.mercadoPagoStatus);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados do Super Admin');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Falha ao salvar configurações');

      setSettingsFeedback({ type: 'success', message: resData.message });
      if (resData.mercadoPagoStatus) {
        setMpTestResult(resData.mercadoPagoStatus);
      }
      await fetchSuperAdminData();
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', message: err.message || 'Erro ao salvar' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestMpConnection = async () => {
    setIsTestingMp(true);
    setMpTestResult(null);

    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: settingsForm.MERCADO_PAGO_ACCESS_TOKEN }),
      });

      const resData = await res.json();
      setMpTestResult(resData);
    } catch (err: any) {
      setMpTestResult({ connected: false, error: err.message || 'Erro ao testar conexão' });
    } finally {
      setIsTestingMp(false);
    }
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seudominio.com';
    const webhookUrl = `${origin}/api/webhooks/mercadopago`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleOpenBusinessModal = (biz: any) => {
    setSelectedBusiness(biz);
    setManagePlan(biz.subscription?.plan || 'STARTER');
    setManageStatus(biz.subscription?.status || 'ACTIVE');
    setExtendDays('30');
  };

  const handleUpdateBusiness = async (withExtend = false) => {
    if (!selectedBusiness) return;
    setIsUpdatingBusiness(true);

    try {
      const payload: any = {
        plan: managePlan,
        status: manageStatus,
      };

      if (withExtend && Number(extendDays) > 0) {
        payload.extendDays = Number(extendDays);
      }

      const res = await fetch(`/api/superadmin/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erro ao atualizar empresa');

      alert(resData.message || 'Empresa atualizada com sucesso!');
      setSelectedBusiness(null);
      await fetchSuperAdminData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar');
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSavingPlan(true);

    try {
      const res = await fetch('/api/superadmin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erro ao atualizar plano');

      alert(resData.message || 'Plano salvo com sucesso!');
      setEditingPlan(null);
      await fetchSuperAdminData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar plano');
    } finally {
      setIsSavingPlan(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{error}</h1>
        <Link
          href="/login"
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fazer Login como Super Admin</span>
        </Link>
      </div>
    );
  }

  const stats = data?.stats || {};
  const businesses = data?.businesses || [];
  const plans = data?.plans || [];

  // Filter businesses
  const filteredBusinesses = businesses.filter((b: any) => {
    const matchesSearch =
      b.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.slug.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.users?.[0]?.email?.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(businessSearch.toLowerCase());

    const matchesPlan =
      planFilter === 'ALL' || (b.subscription?.plan || 'STARTER') === planFilter;

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                👑 Super Admin • Dono do SaaS
              </span>
              <span className="text-xs text-zinc-400 font-mono">TáMarcado v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Painel de Controle do SaaS
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gestão financeira, tokens de pagamento, clientes e planos da plataforma
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSuperAdminData}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Recarregar Dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>

            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel de Negócio</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visão Geral & Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('mercadopago')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'mercadopago'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Gateway Mercado Pago</span>
            {mpTestResult?.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('businesses')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'businesses'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresas & Assinaturas ({businesses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Planos & Preços</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações do SaaS</span>
          </button>
        </div>

        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Macro KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-linear-to-tr from-amber-600 to-amber-700 text-white shadow-lg space-y-2">
                <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
                  MRR do SaaS (Projeção)
                </span>
                <p className="text-3xl font-black">{formatCurrency(stats.estimatedMRR || 0)}</p>
                <span className="text-[11px] text-amber-100 block">Receita Recorrente Mensal</span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Empresas Cadastradas
                </span>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {stats.totalBusinesses || 0}
                </p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-600 font-bold">{stats.activeSubscriptions || 0} Ativas</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{stats.trialingSubscriptions || 0} em Teste</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Agendamentos Totais
                </span>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {stats.totalAppointments || 0}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  Processados em toda a plataforma
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Profissionais Ativos
                </span>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {stats.totalProfessionals || 0}
                </p>
                <span className="text-[11px] text-zinc-400 block">Usuários com agenda vinculada</span>
              </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span>Status do Mercado Pago</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('mercadopago')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Gerenciar Chaves →
                  </button>
                </div>

                {mpTestResult?.connected ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Conexão Ativa com Mercado Pago!</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Conta: <strong>{mpTestResult.user?.nickname || mpTestResult.user?.email || 'Autenticada'}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Modo Demonstração / Simulador</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Insira seu Access Token na aba <strong>Gateway Mercado Pago</strong> para receber pagamentos reais.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Últimas Empresas Cadastradas</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('businesses')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Ver Todas ({businesses.length}) →
                  </button>
                </div>

                <div className="space-y-2">
                  {businesses.slice(0, 3).map((b: any) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="block text-zinc-900 dark:text-zinc-100">{b.name}</strong>
                        <span className="text-zinc-400 text-[10px]">{b.category}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {b.subscription?.plan || 'STARTER'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GATEWAY MERCADO PAGO */}
        {activeTab === 'mercadopago' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Status Banner */}
            <div className="p-6 rounded-3xl bg-linear-to-r from-sky-900/40 via-blue-900/30 to-indigo-900/30 border border-sky-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-inner">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Configurações do Mercado Pago
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Insira seus tokens aqui para que os pagamentos caiam diretamente na sua conta bancária
                    </p>
                  </div>
                </div>

                <div>
                  {mpTestResult?.connected ? (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado com Sucesso!
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Modo Simulação Ativo
                    </span>
                  )}
                </div>
              </div>

              {mpTestResult && (
                <div
                  className={`p-4 rounded-2xl text-xs border ${
                    mpTestResult.connected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <p className="font-semibold">{mpTestResult.message || mpTestResult.error}</p>
                </div>
              )}
            </div>

            {/* Token Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
              {settingsFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs font-medium border ${
                    settingsFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {settingsFeedback.message}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Mercado Pago Access Token <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAccessToken ? 'text' : 'password'}
                      placeholder="APP_USR-xxxxxx-xxxxxx-xxxxxx ou TEST-xxxxxx"
                      value={settingsForm.MERCADO_PAGO_ACCESS_TOKEN}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, MERCADO_PAGO_ACCESS_TOKEN: e.target.value })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-4 pr-10 py-3 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Pegue no portal do desenvolvedor do Mercado Pago (em Credenciais de Produção ou Teste).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Mercado Pago Public Key (Chave Pública)
                  </label>
                  <input
                    type="text"
                    placeholder="APP_USR-xxxxxx ou TEST-xxxxxx"
                    value={settingsForm.MERCADO_PAGO_PUBLIC_KEY}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, MERCADO_PAGO_PUBLIC_KEY: e.target.value })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Ambiente do Gateway
                  </label>
                  <select
                    value={settingsForm.MERCADO_PAGO_ENVIRONMENT}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, MERCADO_PAGO_ENVIRONMENT: e.target.value })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="production">🚀 Produção (Cobranças Reais)</option>
                    <option value="sandbox">🧪 Sandbox (Ambiente de Testes)</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Salvar Credenciais no Sistema</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestMpConnection}
                    disabled={isTestingMp || !settingsForm.MERCADO_PAGO_ACCESS_TOKEN}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingMp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Testar Conexão em Tempo Real</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook Info Card */}
            <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>URL do Webhook para Notificações Automáticas:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-sky-700 dark:text-sky-400 select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/mercadopago` : '/api/webhooks/mercadopago'}
              </div>

              <p className="text-zinc-500 text-[11px]">
                Cadastre esta URL nas configurações de Webhook do Mercado Pago para receber confirmação automática de Pix e Cartão de Crédito.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: GESTÃO DE EMPRESAS */}
        {activeTab === 'businesses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, slug, e-mail ou nicho..."
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-zinc-500 font-semibold shrink-0">Filtrar Plano:</span>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="ALL">Todos os Planos</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Businesses Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Empresas Cadastradas ({filteredBusinesses.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Admin Responsável</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Profissionais</th>
                      <th className="py-3 px-4 text-center">Agendamentos</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredBusinesses.map((b: any) => {
                      const owner = b.users?.[0];
                      const isTrial = b.subscription?.status === 'TRIALING' || !b.subscription;

                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                              {b.name}
                            </div>
                            <span className="text-zinc-400 font-mono text-[10px]">/b/{b.slug}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium">
                              {b.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {owner?.name || 'Admin'}
                            </div>
                            <span className="text-zinc-400 text-[11px]">{owner?.email}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {b.subscription?.plan || 'STARTER'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isTrial
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                              }`}
                            >
                              {isTrial ? 'Período Teste' : 'Assinatura Ativa'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {b._count?.professionals || 0}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {b._count?.appointments || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenBusinessModal(b)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Gerenciar
                            </button>
                            <a
                              href={`/b/${b.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                              title="Ver Página Pública"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLANOS & PREÇOS */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">{plan.name}</h3>
                      <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {plan.slug}
                      </span>
                    </div>

                    <div>
                      <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(plan.priceMonthly)}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">/mês</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <p>
                        👥 Máx. Profissionais: <strong>{plan.maxProfessionals}</strong>
                      </p>
                      <p>
                        ✂️ Máx. Serviços: <strong>{plan.maxServices}</strong>
                      </p>
                      <p>
                        📅 Máx. Agendamentos/Mês: <strong>{plan.maxAppointmentsPerMonth}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPlan({ ...plan })}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Editar Preço e Limites</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURAÇÕES GERAIS */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-black">Configurações Globais da Plataforma</h2>
              <p className="text-xs text-zinc-500">
                Personalize os parâmetros operacionais do SaaS
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nome da Plataforma
                </label>
                <input
                  type="text"
                  value={settingsForm.PLATFORM_NAME}
                  onChange={(e) => setSettingsForm({ ...settingsForm, PLATFORM_NAME: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Período de Teste Grátis Padrão (em dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settingsForm.TRIAL_DAYS}
                  onChange={(e) => setSettingsForm({ ...settingsForm, TRIAL_DAYS: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  WhatsApp de Suporte do SaaS
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={settingsForm.SUPPORT_WHATSAPP}
                  onChange={(e) => setSettingsForm({ ...settingsForm, SUPPORT_WHATSAPP: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  E-mail de Suporte do SaaS
                </label>
                <input
                  type="email"
                  placeholder="suporte@tamarcado.com"
                  value={settingsForm.SUPPORT_EMAIL}
                  onChange={(e) => setSettingsForm({ ...settingsForm, SUPPORT_EMAIL: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Salvar Configurações Gerais</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: GERENCIAR EMPRESA */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Gerenciar {selectedBusiness.name}
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">ID: {selectedBusiness.id}</span>
              </div>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Plano da Empresa
                </label>
                <select
                  value={managePlan}
                  onChange={(e) => setManagePlan(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status da Assinatura
                </label>
                <select
                  value={manageStatus}
                  onChange={(e) => setManageStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="TRIALING">Período de Teste</option>
                  <option value="SUSPENDED">Suspensa / Bloqueada</option>
                  <option value="CANCELED">Cancelada</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 space-y-2">
                <label className="block font-bold text-zinc-700 dark:text-zinc-300">
                  🎁 Conceder Extensão de Dias Grátis:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                  <span className="text-zinc-500 text-xs">dias adicionais</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedBusiness(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdatingBusiness}
                onClick={() => handleUpdateBusiness(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-1.5"
              >
                {isUpdatingBusiness ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PLANO */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Editar Plano {editingPlan.name}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Preço Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingPlan.priceMonthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Máximo de Profissionais
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editingPlan.maxProfessionals}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxProfessionals: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Máximo de Serviços
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editingPlan.maxServices}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxServices: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Máximo de Agendamentos / Mês
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editingPlan.maxAppointmentsPerMonth}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, maxAppointmentsPerMonth: e.target.value })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  {isSavingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>Salvar Plano</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
