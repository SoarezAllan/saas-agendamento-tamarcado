'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { slugify } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusinessName(val);
    if (!customSlug || customSlug === slugify(businessName)) {
      setCustomSlug(slugify(val));
    }
  };

  // Step 1: Request Email Verification Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName || !category || !ownerName || !email || !password) {
      setError('Preencha todos os campos obrigatórios e selecione o segmento do seu negócio');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          ownerName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar código de verificação');
      }

      setStep('VERIFY');
      setResendCooldown(60);
      setSuccessMessage(`Código de 6 dígitos enviado para ${email}!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          ownerName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao reenviar código');
      }

      setResendCooldown(60);
      setSuccessMessage('Novo código enviado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Submit Code and Finalize Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.trim().length < 6) {
      setError('Informe o código de 6 dígitos recebido por e-mail.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          category,
          customSlug: customSlug || slugify(businessName),
          ownerName,
          email,
          password,
          phone,
          address,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao verificar código');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-xl px-4 py-4 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {step === 'FORM' ? 'Cadastre seu Negócio Gratuitamente' : 'Confirme seu E-mail'}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            {step === 'FORM'
              ? 'Crie sua conta em 1 minuto e ganhe 7 dias de teste grátis com página pública e agendamentos ilimitados!'
              : `Enviamos um código de segurança de 6 dígitos para o e-mail ${email}.`}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200 mb-6 animate-in fade-in">
              {error}
            </div>
          )}

          {successMessage && step === 'VERIFY' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 mb-6 animate-in fade-in flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================
              STEP 1: REGISTRATION FORM
              ======================================================== */}
          {step === 'FORM' && (
            <form onSubmit={handleRequestCode} className="space-y-5 animate-in fade-in duration-200">
              {/* Business Info Section */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  1. Dados do seu Estabelecimento
                </span>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome do Negócio <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Barbearia do Silva, Studio Glamour, Dr. Santos..."
                      value={businessName}
                      onChange={handleNameChange}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Segmento / Categoria <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        Selecione um segmento...
                      </option>
                      <option value="Barbearia">Barbearia</option>
                      <option value="Salão de Beleza">Salão de Beleza</option>
                      <option value="Clínica / Estética">Clínica / Estética & Spa</option>
                      <option value="Consultoria / Advocacia">Consultoria / Advocacia / Escritório</option>
                      <option value="Odontologia">Odontologia & Saúde</option>
                      <option value="Personal / Saúde">Personal Trainer & Fitness</option>
                      <option value="Pet Shop">Pet Shop & Banho e Tosa</option>
                      <option value="Fotografia">Fotografia & Estúdio</option>
                      <option value="Aulas Particulares">Aulas Particulares & Mentoria</option>
                      <option value="Tatuagem">Estúdio de Tatuagem</option>
                      <option value="Geral">Outros Serviços</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Link Personalizado (URL)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        /b/
                      </span>
                      <input
                        type="text"
                        placeholder="minha-barbearia"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(slugify(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      WhatsApp do Estabelecimento
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Endereço (opcional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Info Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  2. Seus Dados de Acesso (Gestor)
                </span>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Seu Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Oliveira"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      E-mail de Login <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Criar Senha <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando código de verificação...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Continuar e Verificar E-mail</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================
              STEP 2: EMAIL CODE VERIFICATION
              ======================================================== */}
          {step === 'VERIFY' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-in fade-in duration-200 text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Digite o Código de 6 Dígitos
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Enviamos o código de segurança para <strong>{email}</strong>.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center tracking-[10px] text-2xl font-black font-mono py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-blue-500/40 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                />
                <span className="text-[11px] text-zinc-400 block">
                  Verifique também a pasta de <strong>Spam / Lixo Eletrônico</strong>
                </span>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || code.length < 6}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ativando sua conta...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Verificar e Acessar Painel</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-zinc-500 px-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('FORM');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                  >
                    ← Alterar dados / e-mail
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : isResending
                      ? 'Reenviando...'
                      : 'Reenviar código'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
            Já possui uma conta?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

