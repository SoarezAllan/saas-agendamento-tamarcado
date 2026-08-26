'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Clock,
  Scissors,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDuration, APPOINTMENT_STATUS_MAP } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustomers = async (search = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const handleOpenCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const totalClients = customers.length;
  const totalRevenueAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Base de Clientes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Histórico completo de clientes que já agendaram no seu estabelecimento
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500 block">Total de Clientes</span>
            <strong className="text-sm text-zinc-900 dark:text-zinc-100">{totalClients}</strong>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500 block">Total Faturado</span>
            <strong className="text-sm text-emerald-600 font-bold">
              {formatCurrency(totalRevenueAll)}
            </strong>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
        />
      </form>

      {/* Customers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <UserCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Nenhum cliente registrado
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Clientes que agendarem pela página pública serão salvos aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Telefone / WhatsApp</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-center">Atendimentos</th>
                  <th className="py-3 px-4">Total Gasto</th>
                  <th className="py-3 px-4">Última Visita</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{c.phone}</span>
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {c.email || <span className="text-zinc-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {c.totalAppointments}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {format(new Date(c.lastVisit), "dd/MM/yyyy 'às' HH:mm")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenCustomer(c)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Ver Histórico
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Histórico de Atendimentos: ${selectedCustomer.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl text-xs">
              <div>
                <span className="text-zinc-500 block">WhatsApp:</span>
                <strong className="font-mono">{selectedCustomer.phone}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Investido no Negócio:</span>
                <strong className="text-emerald-600 font-bold text-sm">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Agendamentos Recentes ({selectedCustomer.appointments?.length || 0})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedCustomer.appointments?.map((appt: any) => {
                  const statusCfg = APPOINTMENT_STATUS_MAP[appt.status] || {
                    label: appt.status,
                    bg: 'bg-zinc-100 text-zinc-800',
                  };

                  return (
                    <div
                      key={appt.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {appt.service?.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${statusCfg.bg}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-zinc-500 mt-0.5">
                          {format(new Date(appt.startTime), "dd/MM/yyyy 'às' HH:mm")} • {appt.professional?.name}
                        </p>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(appt.totalPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

