'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Palette,
  Clock,
  Save,
  CheckCircle,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';
import { DAYS_OF_WEEK } from '@/lib/utils';

const COLOR_PRESETS = [
  { label: 'Azul Moderno', value: '#2563eb' },
  { label: 'Âmbar Barbearia', value: '#b45309' },
  { label: 'Rosa Estética & Spa', value: '#db2777' },
  { label: 'Esmeralda Saúde', value: '#059669' },
  { label: 'Azul Céu Dr. Odonto', value: '#0284c7' },
  { label: 'Roxo Premium', value: '#7c3aed' },
  { label: 'Preto Elegance', value: '#18181b' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'hours'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: '',
    slug: '',
    category: 'Barbearia',
    description: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    primaryColor: '#2563eb',
  });

  // Business Hours
  const [businessHours, setBusinessHours] = useState<any[]>([]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [profileRes, hoursRes] = await Promise.all([
        fetch('/api/businesses/profile'),
        fetch('/api/businesses/hours'),
      ]);
      const [pData, hData] = await Promise.all([profileRes.json(), hoursRes.json()]);

      if (pData.business) {
        setProfileData({
          name: pData.business.name || '',
          slug: pData.business.slug || '',
          category: pData.business.category || 'Barbearia',
          description: pData.business.description || '',
          phone: pData.business.phone || '',
          email: pData.business.email || '',
          address: pData.business.address || '',
          logoUrl: pData.business.logoUrl || '',
          primaryColor: pData.business.primaryColor || '#2563eb',
        });
      }

      const existingHours = hData.businessHours || [];
      const formattedHours = Array.from({ length: 7 }).map((_, day) => {
        const found = existingHours.find((h: any) => h.dayOfWeek === day);
        return {
          dayOfWeek: day,
          isOpen: found ? found.isOpen : day >= 1 && day <= 6,
          openTime: found?.openTime || '09:00',
          closeTime: found?.closeTime || '18:00',
          breakStart: found?.breakStart || '12:00',
          breakEnd: found?.breakEnd || '13:00',
        };
      });

      setBusinessHours(formattedHours);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/businesses/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar perfil');

      setSuccessMessage('Informações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/businesses/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar horários');

      setSuccessMessage('Horários de funcionamento salvos com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          Configurações do Negócio
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Personalize as informações da sua empresa, horários gerais e identidade visual
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Dados do Estabelecimento</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Identidade Visual & Cores</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hours'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários Gerais de Abertura</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'profile' ? (
        /* TAB 1: Profile */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs max-w-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nome do Estabelecimento <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Endereço da Página Pública (Slug) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">.../b/</span>
                <input
                  type="text"
                  required
                  value={profileData.slug}
                  onChange={(e) => setProfileData({ ...profileData, slug: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Este é o link que você enviará para seus clientes agendarem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria do Negócio
                </label>
                <select
                  value={profileData.category}
                  onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Barbearia">Barbearia</option>
                  <option value="Salão de Beleza">Salão de Beleza</option>
                  <option value="Clínica de Estética">Clínica de Estética</option>
                  <option value="Consultório Odontológico">Consultório Odontológico</option>
                  <option value="Clínica Médica">Clínica Médica</option>
                  <option value="Pet Shop (Banho e Tosa)">Pet Shop (Banho e Tosa)</option>
                  <option value="Personal Trainer / Fitness">Personal Trainer / Fitness</option>
                  <option value="Estúdio de Tatuagem">Estúdio de Tatuagem</option>
                  <option value="Geral">Outro / Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  WhatsApp do Estabelecimento
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Endereço Físico (Localização)
              </label>
              <input
                type="text"
                placeholder="Ex: Rua Augusta, 1200 - São Paulo, SP"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Descrição Curta
              </label>
              <textarea
                rows={2}
                placeholder="Breve texto sobre o estabelecimento exibido na página pública..."
                value={profileData.description}
                onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Informações</span>
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'branding' ? (
        /* TAB 2: Branding */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL do Logotipo / Imagem
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={profileData.logoUrl}
                  onChange={(e) => setProfileData({ ...profileData, logoUrl: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Cor Primária de Destaque
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {COLOR_PRESETS.map((c) => {
                    const isSelected = profileData.primaryColor.toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, primaryColor: c.value })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-900 dark:border-white ring-2 ring-blue-500'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: c.value }}
                        />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Cor customizada:</span>
                  <input
                    type="color"
                    value={profileData.primaryColor}
                    onChange={(e) => setProfileData({ ...profileData, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {profileData.primaryColor}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Cores & Logo</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Preview da Identidade Visual
            </span>

            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-lg border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden"
                style={{ backgroundColor: profileData.primaryColor }}
              >
                {profileData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileData.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profileData.name[0] || 'A').toUpperCase()
                )}
              </div>

              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                {profileData.name || 'Nome do Negócio'}
              </h4>
              <p className="text-xs text-zinc-500 line-clamp-2">
                {profileData.description || 'Descrição do seu estabelecimento na página de agendamentos.'}
              </p>

              <div className="pt-2">
                <div
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: profileData.primaryColor }}
                >
                  Botão de Agendamento
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 3: Business Hours */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs max-w-2xl">
          <form onSubmit={handleSaveHours} className="space-y-4">
            <p className="text-xs text-zinc-500 mb-4">
              Estes são os horários padrão de abertura e fechamento do estabelecimento. Cada profissional também pode ter sua grade customizada.
            </p>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {businessHours.map((item, idx) => (
                <div key={item.dayOfWeek} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {DAYS_OF_WEEK[item.dayOfWeek]}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={item.isOpen}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[idx].isOpen = e.target.checked;
                          setBusinessHours(updated);
                        }}
                        className="rounded border-zinc-300 text-blue-600"
                      />
                      <span className={item.isOpen ? 'text-emerald-600 font-semibold' : 'text-zinc-400'}>
                        {item.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </label>
                  </div>

                  {item.isOpen && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Abertura:</span>
                        <input
                          type="time"
                          value={item.openTime}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx].openTime = e.target.value;
                            setBusinessHours(updated);
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Fechamento:</span>
                        <input
                          type="time"
                          value={item.closeTime}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx].closeTime = e.target.value;
                            setBusinessHours(updated);
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Início Almoço:</span>
                        <input
                          type="time"
                          value={item.breakStart || ''}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx].breakStart = e.target.value;
                            setBusinessHours(updated);
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Fim Almoço:</span>
                        <input
                          type="time"
                          value={item.breakEnd || ''}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx].breakEnd = e.target.value;
                            setBusinessHours(updated);
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Horários de Funcionamento</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

