'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  LayoutDashboard,
  Scissors,
  Users,
  UserCheck,
  TrendingUp,
  Settings,
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    business?: {
      id: string;
      name: string;
      slug: string;
      category: string;
      primaryColor?: string;
      logoUrl?: string;
    } | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const business = user.business;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  const isSuperAdmin = user.role === 'SUPERADMIN';

  const navItems = isAdmin
    ? [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Agenda / Calendário',
          href: '/dashboard/calendar',
          icon: Calendar,
        },
        {
          label: 'Serviços',
          href: '/dashboard/services',
          icon: Scissors,
        },
        {
          label: 'Profissionais & Horários',
          href: '/dashboard/professionals',
          icon: Users,
        },
        {
          label: 'Clientes',
          href: '/dashboard/customers',
          icon: UserCheck,
        },
        {
          label: 'Financeiro & Métricas',
          href: '/dashboard/financial',
          icon: TrendingUp,
        },
        {
          label: 'Configurações & Marca',
          href: '/dashboard/settings',
          icon: Settings,
        },
        {
          label: 'Planos & Assinatura',
          href: '/dashboard/billing',
          icon: CreditCard,
        },
      ]
    : [
        {
          label: 'Minha Agenda',
          href: '/dashboard/calendar',
          icon: Calendar,
        },
        {
          label: 'Meus Horários & Folgas',
          href: '/dashboard/professionals',
          icon: Clock,
        },
        {
          label: 'Clientes',
          href: '/dashboard/customers',
          icon: UserCheck,
        },
      ];

  const handleCopyLink = () => {
    if (!business?.slug) return;
    const url = `${window.location.origin}/b/${business.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
      setIsLoggingOut(false);
    }
  };

  const primaryColor = business?.primaryColor || '#2563eb';

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            {business?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              (business?.name?.[0] || 'A').toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {business?.name || 'TáMarcado'}
            </h2>
            <span className="inline-block text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {business?.category || (isSuperAdmin ? 'Super Admin' : 'Profissional')}
            </span>
          </div>
        </div>

        {/* Public Booking Link Badge (For Admin / Pros) */}
        {business?.slug && (
          <div className="mt-3.5 p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span className="font-medium text-[11px] uppercase tracking-wider">
                Página de Agendamento
              </span>
              <a
                href={`/b/${business.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
              >
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={`/b/${business.slug}`}
                className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-zinc-700 dark:text-zinc-300 font-mono select-all"
              />
              <button
                onClick={handleCopyLink}
                title="Copiar Link"
                className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-3">
            <Link
              href="/superadmin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              )}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Painel Super Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded font-medium">
                {user.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sair da Conta"
              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

