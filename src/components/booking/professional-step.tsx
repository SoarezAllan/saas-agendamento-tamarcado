'use client';

import React from 'react';
import { Sparkles, Check, User } from 'lucide-react';

export interface ProfessionalItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  services?: { serviceId: string }[];
}

interface ProfessionalStepProps {
  professionals: ProfessionalItem[];
  selectedProfessionalId: string | null; // null or 'any' or specific ID
  onSelectProfessional: (id: string | 'any') => void;
  serviceId: string;
  primaryColor?: string;
}

export function ProfessionalStep({
  professionals,
  selectedProfessionalId,
  onSelectProfessional,
  serviceId,
  primaryColor = '#2563eb',
}: ProfessionalStepProps) {
  // Filter professionals who provide this service
  const eligibleProfessionals = professionals.filter(
    (p) => !p.services || p.services.length === 0 || p.services.some((s) => s.serviceId === serviceId)
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Escolha o Profissional
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Você pode escolher um profissional de sua preferência ou qualquer um disponível
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        {/* Option: Any Available Professional */}
        <div
          onClick={() => onSelectProfessional('any')}
          className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
            selectedProfessionalId === 'any' || selectedProfessionalId === null
              ? 'border-transparent ring-2 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-zinc-300 hover:shadow-xs'
          }`}
          style={{
            boxShadow:
              selectedProfessionalId === 'any' || selectedProfessionalId === null
                ? `0 0 0 2px ${primaryColor}`
                : undefined,
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Qualquer profissional disponível
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mais horários disponíveis (distribuição inteligente)
              </p>
            </div>
          </div>

          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
              selectedProfessionalId === 'any' || selectedProfessionalId === null
                ? 'text-white'
                : 'border border-zinc-300 dark:border-zinc-700'
            }`}
            style={{
              backgroundColor:
                selectedProfessionalId === 'any' || selectedProfessionalId === null
                  ? primaryColor
                  : 'transparent',
            }}
          >
            {(selectedProfessionalId === 'any' || selectedProfessionalId === null) && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
        </div>

        {/* Specific Professionals */}
        {eligibleProfessionals.map((prof) => {
          const isSelected = selectedProfessionalId === prof.id;

          return (
            <div
              key={prof.id}
              onClick={() => onSelectProfessional(prof.id)}
              className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                isSelected
                  ? 'border-transparent ring-2 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-zinc-300 hover:shadow-xs'
              }`}
              style={{
                boxShadow: isSelected ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  {prof.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={prof.avatarUrl}
                      alt={prof.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {prof.name}
                  </h3>
                  {prof.bio && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {prof.bio}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isSelected
                    ? 'text-white'
                    : 'border border-zinc-300 dark:border-zinc-700'
                }`}
                style={{
                  backgroundColor: isSelected ? primaryColor : 'transparent',
                }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

