'use client';

import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Search,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDuration } from '@/lib/utils';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 50 as number | string,
    priceOnRequest: false,
    category: 'Geral',
    active: true,
    professionalIds: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [srvRes, profRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/professionals'),
      ]);
      const [srvData, profData] = await Promise.all([srvRes.json(), profRes.json()]);
      setServices(srvData.services || []);
      setProfessionals(profData.professionals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      durationMinutes: 30,
      price: 50,
      priceOnRequest: false,
      category: 'Geral',
      active: true,
      professionalIds: professionals.map((p) => p.id), // select all by default
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.priceOnRequest ? '' : service.price,
      priceOnRequest: Boolean(service.priceOnRequest) || service.price === 0,
      category: service.category || 'Geral',
      active: service.active,
      professionalIds: service.professionals?.map((p: any) => p.professionalId) || [],
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const url = '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      const payload = editingService ? { id: editingService.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar serviço');

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProfessionalSelection = (profId: string) => {
    setFormData((prev) => {
      const exists = prev.professionalIds.includes(profId);
      return {
        ...prev,
        professionalIds: exists
          ? prev.professionalIds.filter((id) => id !== profId)
          : [...prev.professionalIds, profId],
      };
    });
  };

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category || 'Geral')))];

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || (s.category || 'Geral') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Serviços do Negócio
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Cadastre os procedimentos, durações, preços e profissionais habilitados
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Serviço</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Scissors className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Cadastre seu Primeiro Atendimento ou Serviço
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Adicione os serviços que você ou sua equipe oferecem. Seus clientes poderão escolher o serviço, ver o preço e duração, e agendar direto pela sua página pública.
            </p>
          </div>

          {/* Ideas by Segment */}
          <div className="grid gap-3 sm:grid-cols-3 max-w-2xl mx-auto text-left text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">💈 Beleza & Estilo</span>
              <p className="text-[11px] text-zinc-500">Corte de Cabelo, Barboterapia, Manicure, Escova, Limpeza de Pele...</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">⚖️ Escritórios & Consultoria</span>
              <p className="text-[11px] text-zinc-500">Consulta Inicial, Análise Contratual, Briefing de Projeto, Mentoria...</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">🩺 Saúde & Treinos</span>
              <p className="text-[11px] text-zinc-500">Consulta Médica, Avaliação Nutricional, Fisioterapia, Personal Trainer...</p>
            </div>
          </div>

          <div>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Meu Primeiro Serviço</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {service.category || 'Geral'}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1.5">
                      {service.name}
                    </h3>
                  </div>
                  {service.priceOnRequest || service.price <= 0 ? (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0" title="Valor mediante avaliação com a empresa">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> A combinar
                    </span>
                  ) : (
                    <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(service.price)}
                    </span>
                  )}
                </div>

                {service.description && (
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {formatDuration(service.durationMinutes)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    {service.professionals?.length || 0} profissional(is)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    service.active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {service.active ? 'Ativo na Página Pública' : 'Inativo'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Serviço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar Serviço' : 'Novo Serviço'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Serviço <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Análise de Contrato, Corte Degradê, Avaliação..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Duração (minutos) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) })
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora (60 min)</option>
                <option value={90}>1h 30min (90 min)</option>
                <option value={120}>2 horas (120 min)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Preço (R$) {!formData.priceOnRequest && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                disabled={formData.priceOnRequest}
                required={!formData.priceOnRequest}
                placeholder={formData.priceOnRequest ? 'Sob avaliação' : '0.00'}
                value={formData.priceOnRequest ? '' : formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Contratos, Cabelo..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Price on Request Checkbox */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="priceOnRequestCheckbox"
              checked={formData.priceOnRequest}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({
                  ...formData,
                  priceOnRequest: checked,
                  price: checked ? '' : (formData.price || 50),
                });
              }}
              className="mt-0.5 rounded-md border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label
              htmlFor="priceOnRequestCheckbox"
              className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer select-none leading-relaxed"
            >
              <strong className="block font-bold">Preço sob consulta / Mediante avaliação com a empresa</strong>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                Marque esta opção se o valor do serviço depender de avaliação, orçamento ou não precisar ter preço fixo na página pública.
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Descreva detalhes ou produtos inclusos neste serviço..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          {/* Professionals Assignment */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Profissionais que realizam este serviço:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {professionals.map((prof) => {
                const isSelected = formData.professionalIds.includes(prof.id);
                return (
                  <div
                    key={prof.id}
                    onClick={() => toggleProfessionalSelection(prof.id)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="truncate">{prof.name}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="activeCheckbox"
              className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Exibir este serviço na página pública de agendamentos
            </label>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Serviço</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

