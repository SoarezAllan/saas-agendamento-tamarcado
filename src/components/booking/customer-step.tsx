'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  FileText,
  Calendar,
  Clock,
  Scissors,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface CustomerStepProps {
  service: {
    name: string;
    durationMinutes: number;
    price: number;
    priceOnRequest?: boolean;
    category?: string | null;
  };
  professionalName: string;
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "09:00"
  onSubmit: (customerData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  primaryColor?: string;
}

type AuthMode = 'REGISTER' | 'VERIFY_PIN' | 'LOGIN';

export function CustomerStep({
  service,
  professionalName,
  selectedDate,
  selectedTime,
  onSubmit,
  isSubmitting,
  primaryColor = '#2563eb',
}: CustomerStepProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('REGISTER');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationPin, setVerificationPin] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dateFormatted = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    // Check if customer is already logged in
    fetch('/api/customer/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) {
          setCurrentUser(data.customer);
          if (data.customer.name) setName(data.customer.name);
          if (data.customer.phone) setPhone(formatPhoneMask(data.customer.phone));
          if (data.customer.email) setEmail(data.customer.email);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

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

  // Google Login Success Handler
  const handleGoogleSuccess = (customer: any) => {
    setCurrentUser(customer);
    setName(customer.name || name);
    setEmail(customer.email || email);
    if (customer.phone) setPhone(formatPhoneMask(customer.phone));
    setError(null);
    setAuthMode('REGISTER');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setName('');
      setEmail('');
      setPhone('');
    } catch (e) {}
  };

  // 1. Submit for already logged-in user
  const handleConfirmedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, confirme seu número de telefone/WhatsApp com DDD.');
      return;
    }

    try {
      await onSubmit({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar agendamento');
    }
  };

  // 2. Request Email Verification Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um WhatsApp/Celular válido com DDD.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido para receber a confirmação e os alertas de 24h e 2h.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Crie uma senha de no mínimo 6 caracteres para acessar seus agendamentos.');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/customer/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar código de verificação');
      }

      if (data.isExistingUser) {
        setAuthMode('LOGIN');
        setLoginIdentifier(email.trim().toLowerCase());
        setError('Você já possui uma conta. Por favor, digite sua senha para entrar.');
        return;
      }

      setAuthMode('VERIFY_PIN');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // 3. Verify Code and Complete Registration & Booking
  const handleVerifyCodeAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationPin || verificationPin.trim().length < 6) {
      setError('Digite o código de 6 dígitos que enviamos para o seu e-mail.');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          email: email.trim().toLowerCase(),
          password,
          code: verificationPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código inválido ou expirado.');
      }

      setCurrentUser(data.customer);

      // Immediately trigger the booking creation
      await onSubmit({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim().toLowerCase(),
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // 4. Login with existing account
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Informe seu e-mail/WhatsApp e sua senha.');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      setCurrentUser(data.customer);
      if (data.customer.name) setName(data.customer.name);
      if (data.customer.email) setEmail(data.customer.email);
      if (data.customer.phone) setPhone(formatPhoneMask(data.customer.phone));
      setAuthMode('REGISTER');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Seus Dados & Confirmação
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Identifique-se para receber o comprovante e os alertas de 24h e 2h antes do seu horário.
        </p>
      </div>

      {/* Booking Summary Box */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Resumo do Agendamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Scissors className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">{service.name}</p>
              <p className="text-[11px] text-zinc-500">{formatDuration(service.durationMinutes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">{professionalName}</p>
              <p className="text-[11px] text-zinc-500">Profissional responsável</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm capitalize">{dateFormatted}</p>
              <p className="text-[11px] text-zinc-500">Data selecionada</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">{selectedTime}</p>
              <p className="text-[11px] text-zinc-500">Horário agendado</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Valor do Serviço:
          </span>
          <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
            {service.priceOnRequest || service.price <= 0 ? (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                A combinar
              </span>
            ) : (
              formatCurrency(service.price)
            )}
          </span>
        </div>
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-800 animate-in fade-in">
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENARIO 1: CUSTOMER IS ALREADY LOGGED IN (e.g. Google or Active Session) */}
      {/* ========================================================================= */}
      {currentUser ? (
        <form onSubmit={handleConfirmedSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {currentUser.name}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                  {currentUser.email || 'Conta Verificada'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Trocar conta</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              WhatsApp / Celular de Contato <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Observações ou Preferências (opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                placeholder="Ex: Primeira vez no local, observações especiais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl text-sm sm:text-base font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirmando agendamento...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : authMode === 'VERIFY_PIN' ? (
        /* ========================================================================= */
        /* SCENARIO 2: PIN VERIFICATION (6 DIGITS)                                    */
        /* ========================================================================= */
        <form onSubmit={handleVerifyCodeAndSubmit} className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Confirme seu E-mail
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Enviamos um código de segurança de 6 dígitos para o e-mail{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-2">
              Código de 6 Dígitos
            </label>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={verificationPin}
              onChange={(e) => setVerificationPin(e.target.value.replace(/\D/g, ''))}
              className="w-full tracking-[0.5em] text-center font-mono text-2xl py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 font-bold"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Corrigir dados
            </button>

            <button
              type="button"
              disabled={resendCountdown > 0 || isLoadingAuth}
              onClick={handleSendCode}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>
                {resendCountdown > 0
                  ? `Reenviar código (${resendCountdown}s)`
                  : 'Reenviar código'}
              </span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoadingAuth || isSubmitting || verificationPin.length < 6}
              className="w-full py-3.5 px-6 rounded-xl text-sm sm:text-base font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoadingAuth || isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validando e Confirmando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verificar Código e Agendar</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : authMode === 'LOGIN' ? (
        /* ========================================================================= */
        /* SCENARIO 3: CLIENT LOGIN TAB (ALREADY HAS AN ACCOUNT)                     */
        /* ========================================================================= */
        <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in">
          <div className="space-y-2">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              text="Entrar com o Google"
              phone={phone}
            />

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="shrink mx-3 text-[11px] text-zinc-400 uppercase font-semibold">
                ou entre com sua senha
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              E-mail ou WhatsApp cadastrado
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="seuemail@exemplo.com ou (11) 99999-9999"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Sua Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className="w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              Criar Nova Conta
            </button>

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoadingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Entrar</span>}
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================================= */
        /* SCENARIO 4: NEW CLIENT REGISTRATION (EMAIL PIN OR 1-CLICK GOOGLE)         */
        /* ========================================================================= */
        <form onSubmit={handleSendCode} className="space-y-4">
          {/* Google 1-Click Fast Auth Button */}
          <div className="space-y-2">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              text="Conectar com o Google (Sem Verificação)"
              phone={phone}
            />

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="shrink mx-3 text-[11px] text-zinc-400 uppercase font-semibold">
                ou cadastre-se com e-mail
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Seu E-mail <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Enviaremos o código de segurança e os lembretes de 24h e 2h antes para este e-mail.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Criar Senha de Acesso <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Observações ou Preferências (opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                placeholder="Ex: Primeira vez no local, observações especiais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full py-3.5 px-6 rounded-xl text-sm sm:text-base font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoadingAuth ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando código de segurança...</span>
                </>
              ) : (
                <>
                  <span>Continuar & Receber Código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Já possui uma conta de cliente? Faça login aqui
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
