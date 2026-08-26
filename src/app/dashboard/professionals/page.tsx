'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  Scissors,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { DAYS_OF_WEEK } from '@/lib/utils';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Professional CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    bio: '',
    active: true,
    serviceIds: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Availability Modal
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  const [selectedProfForAvail, setSelectedProfForAvail] = useState<any | null>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [isSavingAvail, setIsSavingAvail] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profRes, srvRes] = await Promise.all([
        fetch('/api/professionals'),
        fetch('/api/services'),
      ]);
      const [profData, srvData] = await Promise.all([profRes.json(), srvRes.json()]);
      setProfessionals(profData.professionals || []);
      setServices(srvData.services || []);
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
    setEditingProf(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatarUrl: '',
      bio: '',
      active: true,
      serviceIds: services.map((s) => s.id),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof: any) => {
    setEditingProf(prof);
    setFormData({
      name: prof.name,
      email: prof.email || '',
      phone: prof.phone || '',
      avatarUrl: prof.avatarUrl || '',
      bio: prof.bio || '',
      active: prof.active,
      serviceIds: prof.services?.map((s: any) => s.serviceId) || [],
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este profissional?')) return;
    try {
      const res = await fetch(`/api/professionals?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const url = '/api/professionals';
      const method = editingProf ? 'PUT' : 'POST';
      const payload = editingProf ? { id: editingProf.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar profissional');

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAvailModal = async (prof: any) => {
    setSelectedProfForAvail(prof);
    // Initialize 7 days availability
    const existing = prof.availabilities || [];
    const formatted = Array.from({ length: 7 }).map((_, day) => {
      const found = existing.find((a: any) => a.dayOfWeek === day);
      return {
        dayOfWeek: day,
        isAvailable: found ? found.isAvailable : day >= 1 && day <= 5,
        startTime: found?.startTime || '09:00',
        endTime: found?.endTime || '18:00',
        breakStart: found?.breakStart || '12:00',
        breakEnd: found?.breakEnd || '13:00',
      };
    });

    setAvailabilities(formatted);
    setIsAvailModalOpen(true);
  };

  const handleSaveAvail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfForAvail) return;
    setIsSavingAvail(true);

    try {
      const res = await fetch(`/api/professionals/${selectedProfForAvail.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilities }),
      });

      if (!res.ok) throw new Error('Erro ao salvar horários');
      setIsAvailModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro');
    } finally {
      setIsSavingAvail(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A foto deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleService = (srvId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(srvId)
        ? prev.serviceIds.filter((id) => id !== srvId)
        : [...prev.serviceIds, srvId],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Equipe e Profissionais
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gerencie os membros da equipe, especialidades e jornadas de trabalho
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Profissional</span>
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Nenhum profissional cadastrado
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 text-xs text-blue-600 font-bold hover:underline"
          >
            + Adicionar primeiro profissional
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {prof.name}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                        prof.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {prof.bio && (
                  <p className="text-xs text-zinc-500 mt-3 line-clamp-2">{prof.bio}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  {prof.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{prof.phone}</span>
                    </div>
                  )}
                  {prof.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </div>
                  )}
                </div>

                {/* Services Tags */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Serviços Habilitados ({prof.services?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {prof.services?.length === 0 ? (
                      <span className="text-xs text-zinc-400">Nenhum serviço vinculado</span>
                    ) : (
                      prof.services.map((s: any) => (
                        <span
                          key={s.serviceId}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                          {s.service?.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenAvailModal(prof)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Horários & Folgas</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prof)}
                    className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Profissional"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prof.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Profissional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Professional Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProf ? 'Editar Profissional' : 'Novo Profissional'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProf} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Profissional <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Ferreira"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                placeholder="carlos@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                WhatsApp / Celular
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Upload da Foto */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Upload da imagem do profissional
            </label>

            {formData.avatarUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.avatarUrl}
                    alt="Foto do Profissional"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                    Foto selecionada
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Aparecerá para os clientes no agendamento
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Remover foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <label className="w-full px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-50/30 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Selecionar foto do computador...</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">
                Ou cole o link da foto:
              </span>
              <input
                type="url"
                placeholder="https://..."
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Biografia / Especialidade
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Barbeiro especialista em degradê e visagismo..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          {/* Services Checklist */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Serviços que este profissional realiza:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {services.map((srv) => {
                const isSelected = formData.serviceIds.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 text-blue-900'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="truncate">{srv.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeProfCheckbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="activeProfCheckbox"
              className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Profissional ativo e disponível para agendamentos
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
              <span>Salvar Profissional</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Working Hours & Breaks Modal */}
      <Modal
        isOpen={isAvailModalOpen}
        onClose={() => setIsAvailModalOpen(false)}
        title={`Horários e Folgas: ${selectedProfForAvail?.name || ''}`}
        description="Defina os horários de início, término e intervalo de almoço para cada dia da semana"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAvail} className="space-y-4">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[60vh] overflow-y-auto pr-1">
            {availabilities.map((item, idx) => (
              <div key={item.dayOfWeek} className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {DAYS_OF_WEEK[item.dayOfWeek]}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(e) => {
                        const updated = [...availabilities];
                        updated[idx].isAvailable = e.target.checked;
                        setAvailabilities(updated);
                      }}
                      className="rounded border-zinc-300 text-blue-600"
                    />
                    <span className={item.isAvailable ? 'text-emerald-600 font-semibold' : 'text-zinc-400'}>
                      {item.isAvailable ? 'Trabalha' : 'Folga / Fechado'}
                    </span>
                  </label>
                </div>

                {item.isAvailable && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Entrada:</span>
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => {
                          const updated = [...availabilities];
                          updated[idx].startTime = e.target.value;
                          setAvailabilities(updated);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Saída:</span>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => {
                          const updated = [...availabilities];
                          updated[idx].endTime = e.target.value;
                          setAvailabilities(updated);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Início Intervalo:</span>
                      <input
                        type="time"
                        value={item.breakStart || ''}
                        onChange={(e) => {
                          const updated = [...availabilities];
                          updated[idx].breakStart = e.target.value;
                          setAvailabilities(updated);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Fim Intervalo:</span>
                      <input
                        type="time"
                        value={item.breakEnd || ''}
                        onChange={(e) => {
                          const updated = [...availabilities];
                          updated[idx].breakEnd = e.target.value;
                          setAvailabilities(updated);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAvailModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingAvail}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingAvail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Horários da Semana</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

