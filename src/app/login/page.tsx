'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Scissors,
  HeartPulse,
  FlaskConical,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (data.user?.role === 'SUPERADMIN') {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Floating Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            SaaS Agendamento
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-black text-zinc-900 dark:text-zinc-100">
          Acesse seu Painel
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Entre com sua conta de administrador ou profissional
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
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
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Senha
              </label>
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

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> Contas de Demonstração (1 Clique)
              </span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Clique em qualquer perfil fictício abaixo para entrar imediatamente no painel de teste:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@barbearia.com', 'admin123')}
                className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 text-amber-950 dark:text-amber-200 text-left transition-all cursor-pointer text-xs"
              >
                <span className="font-bold block flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Barbearia
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 opacity-80 block">Admin do Negócio</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('carlos@barbearia.com', 'pro123')}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-left transition-all cursor-pointer text-xs"
              >
                <span className="font-bold block flex items-center gap-1">
                  👤 Carlos Pro
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Profissional da equipe</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@glow.com', 'admin123')}
                className="p-2.5 rounded-xl border border-pink-200 dark:border-pink-900 bg-pink-50/70 dark:bg-pink-950/30 hover:bg-pink-100/80 text-pink-950 dark:text-pink-200 text-left transition-all cursor-pointer text-xs"
              >
                <span className="font-bold block flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" /> Estética Glow
                </span>
                <span className="text-[10px] text-pink-700 dark:text-pink-400 opacity-80 block">Admin da Clínica</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('superadmin@saas.com', 'super123')}
                className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 text-indigo-950 dark:text-indigo-200 text-left transition-all cursor-pointer text-xs"
              >
                <span className="font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Super Admin
                </span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 opacity-80 block">Dono da Plataforma</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Ainda não tem conta para o seu negócio?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">
              Cadastre seu negócio (7 dias grátis)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

