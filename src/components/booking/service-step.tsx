'use client';

import React, { useState } from 'react';
import { Clock, Tag, Search, Check } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  category?: string | null;
}

interface ServiceStepProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  onSelectService: (service: ServiceItem) => void;
  primaryColor?: string;
}

export function ServiceStep({
  services,
  selectedService,
  onSelectService,
  primaryColor = '#2563eb',
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
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(service.price)}
                  </span>
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
    </div>
  );
}

