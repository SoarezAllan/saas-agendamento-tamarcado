'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Calendar,
  Zap,
} from 'lucide-react';
import { Logo } from './logo';

interface DemoTimerModalProps {
  user: {
    email?: string;
    role?: string;
    business?: {
      slug?: string;
      name?: string;
    };
  };
}

const DEMO_EMAILS = [
  'admin@barbearia.com',
  'carlos@barbearia.com',
  'admin@advocacia.com',
  'admin@arquitetura.com',
  'admin@glow.com',
  'admin@odonto.com',
  'superadmin@saas.com',
];

const DEMO_SLUGS = [
  'barbearia-vintage',
  'clinica-estetica-glow',
  'dr-odonto',
  'albuquerque-advogados',
  'vanguarda-arquitetura',
];

export function DemoTimerModal({ user }: DemoTimerModalProps) {
  const pathname = usePathname();
  const isDemoUser =
    DEMO_EMAILS.includes(user?.email || '') ||
    DEMO_SLUGS.includes(user?.business?.slug || '');

  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  // Reset/Run 60s timer per page visit or demo session
  useEffect(() => {
    if (!isDemoUser) return;

    setSecondsLeft(60);
    setIsExpired(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pathname, isDemoUser]);

  if (!isDemoUser) return null;

  return (
    <>
      {/* Floating Countdown Indicator (While active) */}
      {!isExpired && (
        <div className="fixed bottom-4 right-4 sm:top-3 sm:right-28 sm:bottom-auto z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-md border border-zinc-700 shadow-xl text-xs font-semibold">
          <div
            className={`w-2 h-2 rounded-full ${
              secondsLeft <= 10 ? 'bg-rose-500 animate-ping' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Demonstração:{' '}
            <strong className={secondsLeft <= 10 ? 'text-rose-400 font-bold' : 'text-white'}>
              00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </strong>
          </span>
        </div>
      )}

      {/* Blocking Conversion Modal (When 60s expires) */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="flex justify-center">
              <Logo size="md" />
            </div>

            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Tempo de Demonstração Expirado! ⏰
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Você visualizou 1 minuto do painel em modo de teste. Gostou do que viu? Crie a conta do seu negócio e tenha acesso completo e ilimitado!
              </p>
            </div>

            {/* Value Proposition Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 text-left space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                O que você ganha no cadastro gratuito:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>7 Dias de Teste Grátis</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sem cartão no cadastro</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Página pública exclusiva</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Agendamentos ilimitados</span>
                </li>
              </ul>
            </div>

            {/* Action CTAs */}
            <div className="space-y-3 pt-2">
              <Link
                href="/register"
                className="w-full py-4 px-6 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Cadastrar Gratuitamente por 7 Dias</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-4 text-xs">
                <Link
                  href="/"
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold transition-colors hover:underline"
                >
                  Voltar para a Página Inicial
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <Link
                  href="/login"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Fazer Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
