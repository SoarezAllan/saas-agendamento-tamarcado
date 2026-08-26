'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Info } from 'lucide-react';

interface DemoBannerProps {
  businessName?: string;
}

export function DemoBanner({ businessName }: DemoBannerProps) {
  return (
    <div className="w-full bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-200" />
            Modo Demonstração Interativa
          </span>
          <span className="font-medium">
            {businessName ? (
              <>Você está navegando na demonstração de <strong>{businessName}</strong>.</>
            ) : (
              <>Você está em um ambiente de demonstração com dados de teste.</>
            )}
            {' '}Sinta-se à vontade para agendar e testar todos os passos!
          </span>
        </div>

        <Link
          href="/register"
          className="shrink-0 px-3 py-1 bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
        >
          <span>Criar Minha Empresa (7 Dias Grátis)</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
