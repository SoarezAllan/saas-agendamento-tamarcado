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
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SuperAdminPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados do Super Admin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuperAdminData();
  }, []);

  if (isLoading) {
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
          href="/dashboard"
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Meu Painel</span>
        </Link>
      </div>
    );
  }

  const stats = data?.stats || {};
  const businesses = data?.businesses || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Plataforma Global
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Painel Super Admin - TáMarcado
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Visão macro de todos os negócios cadastrados, assinaturas e receita recorrente
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Acessar Painel do Negócio</span>
          </Link>
        </div>

        {/* Macro KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-linear-to-tr from-amber-600 to-amber-700 text-white shadow-lg space-y-2">
            <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
              MRR do SaaS (Estimado)
            </span>
            <p className="text-3xl font-black">{formatCurrency(stats.estimatedMRR || 0)}</p>
            <span className="text-[11px] text-amber-100 block">Receita Recorrente Mensal</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Negócios Cadastrados
            </span>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.totalBusinesses || 0}
            </p>
            <span className="text-[11px] text-zinc-400 block">Empresas ativas na plataforma</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Total de Agendamentos
            </span>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.totalAppointments || 0}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium block">
              Processados pelo SaaS
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Profissionais Cadastrados
            </span>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.totalProfessionals || 0}
            </p>
            <span className="text-[11px] text-zinc-400 block">Usuários com agenda ativa</span>
          </div>
        </div>

        {/* Mercado Pago Gateway & Payout Info */}
        <div className="p-6 rounded-3xl bg-linear-to-r from-sky-900/40 via-blue-900/30 to-indigo-900/30 border border-sky-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Gateway de Pagamento • Mercado Pago
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Recebimento automático de mensalidades via Pix, Cartão de Crédito e Boleto
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Módulo Ativo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-sky-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Webhook URL (Notificações)
              </span>
              <p className="font-mono text-[11px] text-sky-600 dark:text-sky-400 select-all truncate">
                /api/webhooks/mercadopago
              </p>
              <span className="text-[10px] text-zinc-400 block">
                Processa aprovações de pagamento em tempo real
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-sky-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Repasse Financeiro
              </span>
              <p className="font-bold text-zinc-800 dark:text-zinc-200">
                Conta Bancária / Saldo Mercado Pago
              </p>
              <span className="text-[10px] text-zinc-400 block">
                Transferência via Pix do saldo direto para seu banco
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-sky-500/20 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Configuração das Credenciais
              </span>
              <p className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                Arquivo .env
              </p>
              <span className="text-[10px] text-zinc-400 block">
                Defina <code className="text-sky-600">MERCADO_PAGO_ACCESS_TOKEN</code> com seu token
              </span>
            </div>
          </div>
        </div>

        {/* Businesses Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Empresas Cadastradas ({businesses.length})
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
                  <th className="py-3 px-4 text-center">Profissionais</th>
                  <th className="py-3 px-4 text-center">Agendamentos</th>
                  <th className="py-3 px-4">Criado em</th>
                  <th className="py-3 px-4 text-right">Página Pública</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {businesses.map((b: any) => {
                  const owner = b.users?.[0];

                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {b.name}
                        </div>
                        <span className="text-zinc-400 font-mono text-[10px]">/b/{b.slug}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {owner?.name || 'Admin'}
                        </div>
                        <span className="text-zinc-400 text-[11px]">{owner?.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          {b.subscription?.plan || 'STARTER'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {b._count?.professionals || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {b._count?.appointments || 0}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {format(new Date(b.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/b/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <span>Visitar</span>
                          <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}

