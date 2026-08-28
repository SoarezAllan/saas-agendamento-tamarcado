'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').substring(0, 15);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneMask(e.target.value));
  };

  const handleGoogleSuccess = () => {
    router.push('/cliente');
  };

  // Step 1: Request Email Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Informe um WhatsApp/Celular válido com DDD.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/customer/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar código de verificação');
      }

      if (data.isExistingUser) {
        setError('Você já possui uma conta. Redirecionando para o login...');
        setTimeout(() => router.push('/cliente/login'), 1500);
        return;
      }

      setStep('VERIFY');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code and Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode || verificationCode.length < 6) {
      setError('Digite o código de 6 dígitos enviado para seu e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          email: email.trim().toLowerCase(),
          password,
          code: verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao verificar código');
      }

      router.push('/cliente');
    } catch (err: any) {
      setError(err.message || 'Erro ao confirmar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between py-6 sm:py-12 sm:px-6 lg:px-8">
      {/* Top Left Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-1.5 px-2.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Voltar ao início</span>
        </Link>
      </div>

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
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Criar Conta de Cliente</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {step === 'FORM' ? 'Cadastre-se Gratuitamente' : 'Confirme seu E-mail'}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {step === 'FORM'
              ? 'Acompanhe seus horários marcados, remarque ou cancele serviços em um só lugar.'
              : `Enviamos um código de segurança de 6 dígitos para ${email}`}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-800 animate-in fade-in">
              {error}
            </div>
          )}

          {step === 'FORM' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    WhatsApp / Celular <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    E-mail <span className="text-rose-500">*</span>
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
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Enviaremos um código de verificação para este e-mail.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Confirmar Senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>Continuar & Receber Código</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Código de 6 Dígitos
                </h4>
                <p className="text-xs text-zinc-500">
                  Insira o código numérico enviado para <strong>{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-[0.5em] text-center font-mono text-2xl py-3 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 font-bold"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                >
                  Corrigir dados
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={handleRequestCode}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {resendTimer > 0 ? `Reenviar (${resendTimer}s)` : 'Reenviar código'}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Concluir Cadastro</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-500">
              Já possui uma conta?{' '}
              <Link
                href="/cliente/login"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-zinc-400">
        TáMarcado © {new Date().getFullYear()} - Todos os direitos reservados
      </div>
    </div>
  );
}
