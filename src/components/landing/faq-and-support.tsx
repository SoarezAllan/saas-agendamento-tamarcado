'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Headphones,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Como funciona o teste grátis de 7 dias?',
    answer:
      'Você cria sua conta em menos de 2 minutos e ganha acesso imediato a todas as funcionalidades do sistema para testar com seus clientes e colaboradores. Não cobramos nada e não pedimos cartão no cadastro.',
  },
  {
    question: 'Preciso cadastrar cartão de crédito para começar?',
    answer:
      'Não! O teste é 100% gratuito. Você só escolhe um plano de assinatura se aprovar os resultados e quiser continuar recebendo agendamentos após os 7 dias.',
  },
  {
    question: 'Como meus clientes fazem para agendar?',
    answer:
      'Você recebe um link exclusivo do seu estabelecimento (ex: tamarcado.com.br/b/sua-empresa). Basta colocar na sua bio do Instagram, WhatsApp ou site. O cliente escolhe o serviço, profissional, dia e horário em 4 passos simples, sem precisar baixar app nem criar senha.',
  },
  {
    question: 'Posso cadastrar múltiplos colaboradores e profissionais?',
    answer:
      'Sim! O sistema suporta múltiplos profissionais, cada um com sua própria grade de horários, serviços atendidos e comissões. Cada colaborador também conta com um login restrito para gerenciar sua própria agenda.',
  },
  {
    question: 'Como eu e minha equipe somos avisados dos agendamentos?',
    answer:
      'O sistema envia notificações automáticas no WhatsApp e por E-mail tanto para o proprietário quanto para o profissional designado sempre que um horário for marcado, remarcado ou cancelado.',
  },
  {
    question: 'Consigo bloquear folgas, plantões e férias da equipe?',
    answer:
      'Sim! O painel possui um calendário mensal completo de escalas e folgas até o próximo mês, onde você pode marcar folgas em lote, férias ou horários personalizados com apenas 1 clique.',
  },
  {
    question: 'O TáMarcado funciona bem no celular?',
    answer:
      'Sim! A plataforma foi desenvolvida com design mobile-first ultra veloz. Tanto o painel de gestão quanto a página pública de agendamentos funcionam perfeitamente em celulares Android, iPhones, tablets e computadores.',
  },
];

export function FaqAndSupportSection() {
  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Dúvida sobre os Planos');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [renderTimestamp, setRenderTimestamp] = useState<number>(0);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRenderTimestamp(Date.now());
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message,
          honeypot,
          renderTimestamp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setSuccessMessage(data.message || 'Mensagem enviada com sucesso! Responderemos em breve.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setHoneypot('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 py-12">
      {/* ========================================================
          1. SEÇÃO DE DÚVIDAS FREQUENTES (FAQ)
          ======================================================== */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tire Suas Dúvidas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto">
            Tudo o que você precisa saber sobre o funcionamento, planos e agendamentos do TáMarcado.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={index}
                className="border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in-50 duration-200">
                    <p className="pl-9">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          2. SEÇÃO DE SUPORTE DO TÁMARCADO COM FORMULÁRIO SEGURO
          ======================================================== */}
      <section id="suporte" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 shadow-xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              <span>Canal de Atendimento Oficial</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
              Suporte TáMarcado
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto">
              Precisa de ajuda para configurar seu negócio, tirar dúvidas sobre planos ou suporte técnico? Preencha o formulário abaixo ou fale diretamente conosco.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Direct Info Cards (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">E-mail Direto</h4>
                <p className="text-xs text-zinc-500 break-all">
                  allan.soares.melo@gmail.com
                </p>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block pt-1">
                  Resposta em até 2 horas úteis
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">WhatsApp de Suporte</h4>
                <p className="text-xs text-zinc-500">
                  Atendimento humano e direto para clientes da plataforma.
                </p>
                <a
                  href="https://wa.me/5581999999999?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20T%C3%A1Marcado."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-1"
                >
                  <span>Chamar no WhatsApp</span>
                  <span>→</span>
                </a>
              </div>

              <div className="p-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Proteção Anti-Spam & SSL</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Seus dados são transmitidos de forma segura e criptografada.
                </p>
              </div>
            </div>

            {/* Support Form (8 Cols) */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                {/* Anti-Bot Honeypot Field (Invisível para humanos, mas preenchido por robôs maliciosos) */}
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                  <label htmlFor="website_hp">Não preencha este campo:</label>
                  <input
                    type="text"
                    id="website_hp"
                    name="website_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Success Feedback */}
                {successMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Error Feedback */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Allan Soares"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Seu E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(81) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Assunto *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    >
                      <option value="Dúvida sobre os Planos">Dúvida sobre os Planos</option>
                      <option value="Suporte Técnico / Dificuldade">Suporte Técnico / Dificuldade</option>
                      <option value="Dúvida sobre Pagamentos e Assinatura">Dúvida sobre Pagamentos e Assinatura</option>
                      <option value="Sugestão de Recurso ou Melhoria">Sugestão de Recurso ou Melhoria</option>
                      <option value="Outro Assunto">Outro Assunto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Mensagem ou Dúvida *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva detalhadamente como podemos te ajudar..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-zinc-400 text-center sm:text-left">
                    Destino: <strong className="text-zinc-600 dark:text-zinc-300">allan.soares.melo@gmail.com</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensagem para o Suporte</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
