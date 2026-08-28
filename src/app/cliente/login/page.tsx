'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Lock,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/cliente';

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = () => {
    router.push(redirectUrl);
  };

  const [profileChoice, setProfileChoice] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      if (data.hasBusinessProfile) {
        setProfileChoice(data);
        setIsLoading(false);
        return;
      }

      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  if (profileChoice) {
    return (
      <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 space-y-6 animate-in fade-in">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Como deseja acessar agora?
          </h3>
          <p className="text-xs text-zinc-500">
            Identificamos que você possui acesso tanto como cliente quanto como gestor do negócio <strong>{profileChoice.businessName || ''}</strong>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Option 1: Access Customer Portal */}
          <button
            type="button"
            onClick={() => {
              router.push('/cliente');
            }}
            className="w-full p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/50 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Área do Cliente
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                  Meus Agendamentos
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Acessar meus horários marcados
              </p>
              <p className="text-[11px] text-zinc-500">
                Ver serviços agendados em outros estabelecimentos
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Access Business Dashboard */}
          <button
            type="button"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                  Painel do Negócio
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                  Gestor / Dono
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {profileChoice.businessName || 'Gerenciar Meu Negócio'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Agenda da empresa, faturamento, equipe e configurações
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200 animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            E-mail ou WhatsApp (com DDD)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="seu@email.com ou (11) 99999-9999"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Sua Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Acessar Meus Agendamentos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-3">
        <p className="text-xs text-zinc-500">
          Ainda não tem uma conta?{' '}
          <Link
            href="/cliente/cadastro"
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Criar conta de cliente
          </Link>
        </p>
        <p className="text-[11px] text-zinc-400">
          É dono de um estabelecimento?{' '}
          <Link href="/login" className="font-semibold text-zinc-600 dark:text-zinc-300 hover:underline">
            Painel do Profissional
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between py-6 sm:py-12 sm:px-6 lg:px-8">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Centered Logo */}
      <div className="w-full flex justify-center py-2">
        <Logo href="/" size="md" />
      </div>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md px-4 py-4 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Portal do Cliente</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Meus Agendamentos
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Consulte seus horários marcados, remarque ou cancele serviços em um só lugar
          </p>
        </div>

        {/* Profile Mode Switcher Tabs */}
        <div className="flex p-1.5 bg-zinc-200/90 dark:bg-zinc-800/90 rounded-2xl border border-zinc-300/80 dark:border-zinc-700/80 shadow-xs">
          <button
            type="button"
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-default transition-all"
          >
            <User className="w-4 h-4 text-white" />
            <span>Área do Cliente</span>
          </button>
          <Link
            href="/login"
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 flex items-center justify-center gap-2 transition-all"
          >
            <Shield className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Dono / Gestor</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="bg-white dark:bg-zinc-900 py-12 px-6 rounded-3xl text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          }
        >
          <CustomerLoginForm />
        </Suspense>
      </div>

      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-zinc-400">
        TáMarcado © {new Date().getFullYear()} - Todos os direitos reservados
      </div>
    </div>
  );
}

