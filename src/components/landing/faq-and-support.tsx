'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  HelpCircle,
  Headphones,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Como funciona o teste grátis de 7 dias?',
    answer:
      'Você cria sua conta em menos de 2 minutos e ganha acesso imediato a todas as funcionalidades do sistema para testar com seus clientes e colaboradores durante todo o período de avaliação.',
  },
  {
    question: 'Como funciona a assinatura após os 7 dias?',
    answer:
      'Durante os 7 dias de teste você tem acesso total a todos os recursos da plataforma para automatizar seus agendamentos. Você tem total liberdade e controle sobre sua conta para gerenciar seu plano diretamente pelo painel a qualquer momento.',
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

interface FaqSectionProps {
  onOpenSupport?: () => void;
}

export function FaqSection({ onOpenSupport }: FaqSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tire Suas Dúvidas</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
          Dúvidas frequentes
        </h2>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto">
          Tudo o que você precisa saber sobre o funcionamento, planos e agendamentos do TáMarcado.
        </p>
      </div>

      {/* Accordion list */}
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

      {/* Clean Support Callout at the bottom of FAQ */}
      {onOpenSupport && (
        <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Ainda ficou com alguma dúvida ou precisa de ajuda técnica?
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Nossa equipe de suporte está à disposição para te auxiliar a configurar o seu estabelecimento ou tirar dúvidas.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenSupport}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Falar com o Suporte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Alias export for backward compatibility
export const FaqAndSupportSection = FaqSection;
