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
  Activity,
  BarChart3,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  MousePointer,
  Compass,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'mercadopago' | 'businesses' | 'plans' | 'settings'>('overview');

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
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);

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
      if (!res.ok) throw new Error(resData.error || 'Erro ao salvar configurações');

      setSettingsFeedback({ type: 'success', message: 'Configurações salvas com sucesso!' });
      await fetchSuperAdminData();
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', message: err.message || 'Erro ao salvar configurações' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestMercadoPago = async () => {
    setIsTestingMp(true);
    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsForm,
          testOnly: true,
        }),
      });

      const resData = await res.json();
      setMpTestResult(resData.mercadoPagoStatus);

      if (resData.mercadoPagoStatus?.connected) {
        alert('✅ Conexão com Mercado Pago efetuada com sucesso!');
      } else {
        alert(`❌ Falha ao conectar: ${resData.mercadoPagoStatus?.message || 'Verifique o Token'}`);
      }
    } catch (err) {
      alert('Erro ao testar conexão.');
    } finally {
      setIsTestingMp(false);
    }
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tamarcado.com.br';
    const webhookUrl = `${origin}/api/webhooks/mercadopago`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleOpenBusinessModal = (business: any) => {
    setSelectedBusiness(business);
    setManagePlan(business.subscription?.plan || 'STARTER');
    setManageStatus(business.subscription?.status || 'ACTIVE');
    setExtendDays('30');
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    setIsUpdatingBusiness(true);

    try {
      const res = await fetch(`/api/superadmin/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: managePlan,
          status: manageStatus,
          extendDays: Number(extendDays),
        }),
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

  const handleDeleteBusiness = async (businessId: string, businessName: string) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o estabelecimento "${businessName}"?\n\nTodos os agendamentos, serviços, profissionais e usuários deste estabelecimento serão excluídos.`
    );
    if (!confirmDelete) return;

    setDeletingBusinessId(businessId);
    try {
      const res = await fetch(`/api/superadmin/businesses/${businessId}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erro ao excluir');

      alert(resData.message || 'Empresa excluída com sucesso!');
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness(null);
      }
      await fetchSuperAdminData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir estabelecimento');
    } finally {
      setDeletingBusinessId(null);
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
  const analytics = data?.analytics || {};
  const businesses = data?.businesses || [];
  const plans = data?.plans || [];

  // Filter businesses
  const filteredBusinesses = businesses.filter((b: any) => {
    const matchesSearch =
      b.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.slug.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.users?.[0]?.email?.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.category?.toLowerCase().includes(businessSearch.toLowerCase());

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
                👑 Super Admin • Dono da Plataforma
              </span>
              <span className="text-xs text-zinc-400 font-mono">TáMarcado Produção</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Painel de Controle Geral
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Indicadores reais de acesso, telemetria de tráfego, gestão de empresas e pagamentos
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
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Site Principal</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visão Geral & Negócio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Indicadores & Tráfego</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              NOVO
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mercadopago')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações do SaaS</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: VISÃO GERAL & NEGÓCIO (DADOS 100% REAIS)
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Real Macro KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-700 text-white shadow-lg space-y-2">
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">
                  MRR do SaaS (Receita Real)
                </span>
                <p className="text-3xl font-black">{formatCurrency(stats.estimatedMRR || 0)}</p>
                <span className="text-[11px] text-blue-100 block">
                  {stats.activeSubscriptions || 0} assinaturas ativas
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Empresas Reais Cadastradas
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
                  Agendamentos Criados
                </span>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {stats.totalAppointments || 0}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  Em toda a plataforma
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Total de Visualizações do Site
                </span>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {analytics.totalPageViews || 0}
                </p>
                <span className="text-[11px] text-indigo-600 font-bold block">
                  {analytics.uniqueVisitorsCount || 0} visitantes únicos
                </span>
              </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span>Status do Gateway de Pagamento</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('mercadopago')}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
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
                      <span>Mercado Pago em Configuração</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Adicione seu Access Token na aba <strong>Gateway Mercado Pago</strong> para processar Pix e Cartão reais.
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
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Ver Todas ({businesses.length}) →
                  </button>
                </div>

                {businesses.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-2">
                    <p className="text-xs text-zinc-500 font-medium">
                      Nenhum estabelecimento cadastrado no momento.
                    </p>
                    <span className="text-[11px] text-zinc-400 block">
                      Assim que novos usuários criarem suas contas na página pública ou pelo formulário de cadastro, elas aparecerão aqui em tempo real.
                    </span>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: INDICADORES & TELEMETRIA DO SITE (NOVO)
            ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Real Web Indicators KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Acessos Hoje</span>
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {analytics.pageViewsToday || 0}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span>{analytics.uniqueVisitorsToday || 0} visitantes únicos hoje</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Acessos nos Últimos 7 Dias</span>
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {analytics.pageViews7d || 0}
                </p>
                <span className="text-[11px] text-indigo-600 font-bold block">
                  {analytics.pageViews30d || 0} visualizações em 30 dias
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Tempo Médio na Página</span>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {analytics.avgDurationFormatted || '0m 45s'}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  Engajamento ativo dos visitantes
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Taxa de Conversão</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {analytics.conversionRate || 0}%
                </p>
                <span className="text-[11px] text-zinc-500 block">
                  Visitas → Ações concretas na plataforma
                </span>
              </div>
            </div>

            {/* Daily Activity Chart & Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Chart (8 cols) */}
              <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span>Acessos Diários nos Últimos 7 Dias</span>
                  </h3>
                  <span className="text-xs text-zinc-400 font-semibold">Total: {analytics.pageViews7d || 0}</span>
                </div>

                <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                  {(analytics.dailyChart || []).map((item: any, idx: number) => {
                    const maxVal = Math.max(...(analytics.dailyChart || []).map((i: any) => i.views), 1);
                    const heightPercent = Math.max(Math.round((item.views / maxVal) * 100), 8);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex flex-col items-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                            {item.views}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[42px] rounded-t-xl bg-linear-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 transition-all min-h-[12px]"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">
                          {item.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices Breakdown (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Dispositivos dos Usuários</span>
                </h3>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span>Celular (Mobile)</span>
                      </span>
                      <span>{analytics.devicePercentages?.mobile || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${analytics.devicePercentages?.mobile || 0}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Laptop className="w-4 h-4 text-emerald-600" />
                        <span>Computador (Desktop)</span>
                      </span>
                      <span>{analytics.devicePercentages?.desktop || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${analytics.devicePercentages?.desktop || 0}%` }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Tablet className="w-4 h-4 text-purple-600" />
                        <span>Tablet</span>
                      </span>
                      <span>{analytics.devicePercentages?.tablet || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${analytics.devicePercentages?.tablet || 0}%` }}
                        className="h-full bg-purple-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Pages & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>Páginas Mais Acessadas</span>
                </h3>

                {(analytics.topPages || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">Nenhum dado coletado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {(analytics.topPages || []).map((page: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {page.path}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 shrink-0">
                          {page.count} visualizações
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Traffic Sources */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>Origem do Tráfego (Fontes & Redes)</span>
                </h3>

                {(analytics.topTrafficSources || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">Nenhum dado coletado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {(analytics.topTrafficSources || []).map((source: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between text-xs"
                      >
                        <strong className="text-zinc-800 dark:text-zinc-200">{source.source}</strong>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {source.count} visitas
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Recent Activity Stream */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Registro de Acessos Recentes em Tempo Real</span>
                </h3>
                <span className="text-xs text-zinc-400">Últimos eventos gravados</span>
              </div>

              {(analytics.recentViews || []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">Navegue pelas páginas do site para ver o registro em tempo real.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Data e Hora</th>
                        <th className="py-2.5 px-3">Página Acessada</th>
                        <th className="py-2.5 px-3">Dispositivo</th>
                        <th className="py-2.5 px-3">Origem</th>
                        <th className="py-2.5 px-3 text-right">Tempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {(analytics.recentViews || []).map((view: any) => (
                        <tr key={view.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                            {format(new Date(view.createdAt), 'dd/MM HH:mm:ss', { locale: ptBR })}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {view.path}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                              {view.deviceType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {view.referrer || 'Direto'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-500">
                            {view.durationSeconds > 0 ? `${view.durationSeconds}s` : '< 5s'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: GATEWAY MERCADO PAGO
            ======================================================== */}
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
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Mercado Pago Access Token (Chave Secreta de Produção)
                  </label>
                  <div className="relative">
                    <input
                      type={showAccessToken ? 'text' : 'password'}
                      placeholder="APP_USR-xxxxxx-xxxxxx-xxxxxx..."
                      value={settingsForm.MERCADO_PAGO_ACCESS_TOKEN}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, MERCADO_PAGO_ACCESS_TOKEN: e.target.value })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-4 pr-12 py-3 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Mercado Pago Public Key
                    </label>
                    <input
                      type="text"
                      placeholder="APP_USR-xxxxxx..."
                      value={settingsForm.MERCADO_PAGO_PUBLIC_KEY}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, MERCADO_PAGO_PUBLIC_KEY: e.target.value })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Ambiente
                    </label>
                    <select
                      value={settingsForm.MERCADO_PAGO_ENVIRONMENT}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, MERCADO_PAGO_ENVIRONMENT: e.target.value })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="production">Produção (Pagamentos Reais)</option>
                      <option value="sandbox">Sandbox (Testes)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Salvar Configurações</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestMercadoPago}
                    disabled={isTestingMp}
                    className="px-5 py-3 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingMp ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Testar Conexão</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook Card */}
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
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: GESTÃO DE EMPRESAS & ASSINATURAS
            ======================================================== */}
        {activeTab === 'businesses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, slug ou e-mail..."
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

              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-500 font-semibold">Nenhuma empresa encontrada.</p>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Todos os novos cadastros feitos por clientes reais aparecerão listados aqui automaticamente.
                  </p>
                </div>
              ) : (
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
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenBusinessModal(b)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                Gerenciar
                              </button>
                              <button
                                onClick={() => handleDeleteBusiness(b.id, b.name)}
                                disabled={deletingBusinessId === b.id}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Excluir Estabelecimento"
                              >
                                {deletingBusinessId === b.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
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
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: PLANOS & PREÇOS
            ======================================================== */}
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
                      <span className="text-3xl font-black">{formatCurrency(plan.priceMonthly)}</span>
                      <span className="text-xs text-zinc-400"> /mês</span>
                    </div>

                    <div className="text-xs text-zinc-500 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <strong>Profissionais:</strong> {plan.maxProfessionals === 999 ? 'Ilimitados' : plan.maxProfessionals}
                      </div>
                      <div>
                        <strong>Serviços:</strong> {plan.maxServices === 999 ? 'Ilimitados' : plan.maxServices}
                      </div>
                      <div>
                        <strong>Agendamentos:</strong> {plan.maxAppointmentsPerMonth === 9999 ? 'Ilimitados' : `${plan.maxAppointmentsPerMonth}/mês`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Editar Preço & Limites
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: CONFIGURAÇÕES GERAIS DO SAAS
            ======================================================== */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6 animate-in fade-in duration-200">
            <h2 className="text-lg font-black pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Configurações Globais da Plataforma
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nome da Plataforma
                </label>
                <input
                  type="text"
                  value={settingsForm.PLATFORM_NAME}
                  onChange={(e) => setSettingsForm({ ...settingsForm, PLATFORM_NAME: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Dias de Teste Grátis no Cadastro (Trial)
                </label>
                <input
                  type="number"
                  value={settingsForm.TRIAL_DAYS}
                  onChange={(e) => setSettingsForm({ ...settingsForm, TRIAL_DAYS: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Salvar Alterações</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal: Gerenciar Empresa */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold">{selectedBusiness.name}</h3>
                <span className="text-xs text-zinc-400 font-mono">ID: {selectedBusiness.id}</span>
              </div>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBusiness} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Alterar Plano</label>
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
                <label className="block text-xs font-bold mb-1">Status da Assinatura</label>
                <select
                  value={manageStatus}
                  onChange={(e) => setManageStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="ACTIVE">Ativa (Pago)</option>
                  <option value="TRIALING">Período Teste</option>
                  <option value="PAST_DUE">Inadimplente</option>
                  <option value="CANCELED">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Estender Validade (Dias de Cortesia)</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleDeleteBusiness(selectedBusiness.id, selectedBusiness.name)}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Empresa</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBusiness(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingBusiness}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                  >
                    {isUpdatingBusiness ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Plano */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold">Editar Plano {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="p-1 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Preço Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.priceMonthly}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, priceMonthly: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Preço Trimestral (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.priceQuarterly || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priceQuarterly: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Preço Anual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.priceAnnual || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priceAnnual: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Máximo de Profissionais</label>
                <input
                  type="number"
                  value={editingPlan.maxProfessionals}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, maxProfessionals: parseInt(e.target.value) })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Máximo de Serviços</label>
                <input
                  type="number"
                  value={editingPlan.maxServices}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, maxServices: parseInt(e.target.value) })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  {isSavingPlan ? 'Salvando...' : 'Salvar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
