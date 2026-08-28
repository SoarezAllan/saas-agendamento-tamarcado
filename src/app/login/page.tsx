'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Scissors,
  User,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileChoiceData, setProfileChoiceData] = useState<any | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const emailParam = searchParams.get('email');

    if (roleParam === 'owner' || emailParam === 'admin@barbearia.com') {
      setEmail('admin@barbearia.com');
      setPassword('admin123');
    } else if (roleParam === 'professional' || emailParam === 'carlos@barbearia.com') {
      setEmail('carlos@barbearia.com');
      setPassword('pro123');
    }
  }, [searchParams]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      if (data.hasCustomerAppointments && data.user?.role !== 'SUPERADMIN') {
        setProfileChoiceData(data);
        setIsLoading(false);
        return;
      }

      if (data.user?.role === 'SUPERADMIN') {
        window.location.href = '/superadmin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    handleLogin(undefined, fillEmail, fillPass);
  };

  if (profileChoiceData) {
    const biz = profileChoiceData.user?.business;
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
            Identificamos que você possui acesso administrativo e agendamentos pessoais de cliente.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Option 1: Access Business Dashboard */}
          <button
            type="button"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="w-full p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/50 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Painel do Negócio
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                  {profileChoiceData.user?.role === 'ADMIN' ? 'Gestor / Dono' : 'Profissional'}
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {biz?.name || 'Administração'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Gerenciar agenda, serviços, faturamento e clientes
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Access Customer Portal */}
          <button
            type="button"
            onClick={() => {
              window.location.href = '/cliente';
            }}
            className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                  Área do Cliente
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                  {profileChoiceData.customerAppointmentsCount} {profileChoiceData.customerAppointmentsCount === 1 ? 'horário' : 'horários'}
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Meus Agendamentos Pessoais
              </p>
              <p className="text-[11px] text-zinc-500">
                Ver horários agendados em outros estabelecimentos
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
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Esqueceu a senha?
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
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Customer Area Callout */}
      <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-blue-900 dark:text-blue-200 block">É cliente de um serviço?</span>
          <span className="text-[11px] text-blue-700 dark:text-blue-400 block">Consulte seus horários marcados</span>
        </div>
        <Link
          href="/cliente/login"
          className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
        >
          <span>Área do Cliente</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Ainda não tem conta para o seu negócio?{' '}
        <Link href="/register" className="text-blue-600 font-bold hover:underline">
          Cadastre seu negócio (7 dias grátis)
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Acesse seu Painel
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Entre com sua conta de administrador ou profissional
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white dark:bg-zinc-900 py-12 px-6 rounded-3xl text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-zinc-400">
        TáMarcado © {new Date().getFullYear()} - Todos os direitos reservados
      </div>
    </div>
  );
}
