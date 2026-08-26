'use client';

import React, { useState } from 'react';
import { Clock, Tag, Search, Check, HelpCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  priceOnRequest?: boolean;
  category?: string | null;
}

interface ServiceStepProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  onSelectService: (service: ServiceItem) => void;
  primaryColor?: string;
  businessPhone?: string | null;
  businessName?: string;
}

export function ServiceStep({
  services,
  selectedService,
  onSelectService,
  primaryColor = '#2563eb',
  businessPhone,
  businessName,
}: ServiceStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category || 'Geral')))];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || (service.category || 'Geral') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const cleanPhone = (businessPhone || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const defaultMsg = encodeURIComponent(
    `Olá! Gostaria de tirar dúvidas sobre qual serviço é mais indicado para o meu caso no(a) ${businessName || 'estabelecimento'}. Poderia me ajudar?`
  );
  const whatsAppHelpUrl = cleanPhone ? `https://wa.me/${phoneWithCountry}?text=${defaultMsg}` : '#';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Escolha o Serviço
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Selecione o procedimento que deseja agendar
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviço por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {cat === 'all' ? 'Todos os Serviços' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid gap-3 sm:grid-cols-1">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-sm text-zinc-500">Nenhum serviço encontrado.</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const isSelected = selectedService?.id === service.id;

            return (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-transparent ring-2 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-zinc-300 hover:shadow-xs'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 0 2px ${primaryColor}` : undefined,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                      {service.name}
                    </h3>
                    {service.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                        {service.category}
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  {service.priceOnRequest || service.price <= 0 ? (
                    <div
                      className="group/tooltip relative inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 cursor-help"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                        A combinar
                      </span>
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />

                      {/* Tooltip on Hover */}
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 w-64 p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs leading-relaxed shadow-2xl border border-zinc-700 pointer-events-none text-left animate-in fade-in zoom-in-95 duration-150">
                        <p className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Valor sob avaliação
                        </p>
                        <p className="text-zinc-300 text-[11px] leading-snug">
                          O valor deste serviço é definido mediante avaliação personalizada ou orçamento prévio com a empresa.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(service.price)}
                    </span>
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'text-white'
                        : 'border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400'
                    }`}
                    style={{
                      backgroundColor: isSelected ? primaryColor : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Help CTA Button */}
      {businessPhone && (
        <div className="pt-2">
          <a
            href={whatsAppHelpUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  Dúvidas sobre qual serviço precisa?
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Fale conosco no WhatsApp para tirar dúvidas e receber orientação
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs group-hover:bg-emerald-700 transition-colors">
              <span className="hidden sm:inline">Fale Conosco</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      )}
    </div>
  );
}

