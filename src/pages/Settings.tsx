import React, { useState, useEffect } from 'react';
import { Save, Building2, MessageCircle, Clock, Camera, Loader2, Globe, FileText, CreditCard, CheckCircle2, ShieldCheck, Zap, Rocket, Image as ImageIcon, PartyPopper, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { uploadImage } from '../lib/storage';
import confetti from 'canvas-confetti';

const SettingsPage = () => {
  const utils = trpc.useContext();
  const { data: restaurant, isLoading: loadingRestaurant } = trpc.restaurants.get.useQuery();
  const { data: plans, isLoading: loadingPlans } = trpc.plans.list.useQuery();
  
  const updateMutation = trpc.restaurants.update.useMutation({
    onSuccess: (data) => {
      console.log('[SERVER RESPONSE]', data);
      utils.restaurants.invalidate();
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (err) => {
      console.error('[UPDATE ERROR]', err);
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  const wsMutation = trpc.restaurants.updateWhatsAppSettings.useMutation({
    onSuccess: () => {
      utils.restaurants.invalidate();
      toast.success('Configurações de WhatsApp salvas!');
    },
    onError: (err) => {
      toast.error('Erro ao salvar WhatsApp: ' + err.message);
    }
  });

  const verifyMutation = trpc.payments.verifySubscription.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        utils.restaurants.invalidate();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6']
        });
        toast.success(`Parabéns! Seu plano foi atualizado para ${(data as any).planId?.toUpperCase()}.`, {
          duration: 5000,
          icon: <PartyPopper className="text-primary" />
        });
      }
    }
  });

  const checkoutMutation = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      toast.error('Erro ao iniciar checkout: ' + err.message);
    }
  });

  const [formData, setFormData] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      verifyMutation.mutate({ sessionId });
      // Limpar a URL sem recarregar a página
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (params.get('canceled') === 'true') {
      toast.error('O checkout foi cancelado. Nenhuma cobrança foi realizada.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (restaurant) {
      let openingHours = restaurant.openingHours;
      if (typeof openingHours === 'string') {
        try { openingHours = JSON.parse(openingHours); } catch { openingHours = {}; }
      }
      
      const DAYS_OF_WEEK = [
        { id: 'seg', name: 'Segunda-feira' },
        { id: 'ter', name: 'Terça-feira' },
        { id: 'qua', name: 'Quarta-feira' },
        { id: 'qui', name: 'Quinta-feira' },
        { id: 'sex', name: 'Sexta-feira' },
        { id: 'sab', name: 'Sábado' },
        { id: 'dom', name: 'Domingo' },
      ];
 
      const initializedHours = { ...(openingHours as any) };
      DAYS_OF_WEEK.forEach(day => {
        if (!initializedHours[day.id]) {
          initializedHours[day.id] = { isOpen: day.id !== 'dom', open: '09:00', close: '19:00' };
        }
      });
 
      setFormData({
        ...restaurant,
        description: restaurant.description || '',
        subscription_plan: restaurant.subscriptionPlan || 'pedidos',
        banner_url: restaurant.bannerUrl || '',
        logo_url: restaurant.logoUrl || '',
        opening_hours: initializedHours,
        evolution_api_url: restaurant.evolutionApiUrl || '',
        evolution_api_key: restaurant.evolutionApiKey || '',
        evolution_instance: restaurant.evolutionInstance || '',
        cep: restaurant.cep || '',
        address: restaurant.address || '',
        complement: restaurant.complement || '',
        neighborhood: restaurant.neighborhood || '',
        city: restaurant.city || '',
        state: restaurant.state || ''
      });
    }
  }, [restaurant]);

  const applyPhoneMask = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return digits.slice(0, 11)
      .replace(/(\d{2})(\d)/, '$1 $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const formatted = applyPhoneMask(e.target.value);
    setFormData({ ...formData, [field]: formatted });
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (cep?.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData({
          ...formData,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        });
        toast.success('Endereço preenchido automaticamente!');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP', error);
    }
  };

  const handleSave = () => {
    if (!formData.name) return toast.error('Nome é obrigatório');
    
    console.log('[CLIENT DEBUG] Salvando Dados:', {
      url: formData.evolution_api_url,
      instance: formData.evolution_instance,
      hasKey: !!formData.evolution_api_key
    });

    updateMutation.mutate({
      name: formData.name,
      description: formData.description,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      opening_hours: formData.opening_hours,
      subscription_plan: formData.subscription_plan,
      logo_url: formData.logo_url,
      banner_url: formData.banner_url,
      slug: formData.slug,
      evolution_api_url: formData.evolution_api_url,
      evolution_api_key: formData.evolution_api_key,
      evolution_instance: formData.evolution_instance,
      cep: formData.cep,
      address: formData.address,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state
    });
  };

  const handleCheckout = (planId: string) => {
    const plan = plans?.find(p => p.id === planId);
    if (!plan?.stripePriceId) {
      return toast.error('Este plano ainda não está configurado para pagamentos.');
    }
    
    checkoutMutation.mutate({
      priceId: plan.stripePriceId || '',
      restaurantId: restaurant?.id || '',
      planId: plan.id
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);
      
      const url = await uploadImage(file, type === 'logo' ? 'logos' : 'banners');
      setFormData({ ...formData, [type === 'logo' ? 'logo_url' : 'banner_url']: url });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} atualizado!`);
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  if (loadingRestaurant || loadingPlans || !formData) return <div className="p-8 text-center text-slate-400">Carregando configurações...</div>;

  return (
    <div className="space-y-12 max-w-6xl pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Configurações do Restaurante</h2>
        <p className="text-slate-500">Gerencie sua identidade, planos e horários de atendimento.</p>
      </header>

      {/* Seção de Planos com Checkout */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <CreditCard size={24} />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Seu Plano de Assinatura</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isActive = restaurant?.subscriptionPlan === plan.id;
            const isSelected = formData.subscription_plan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -5 }}
                onClick={() => setFormData({ ...formData, subscription_plan: plan.id })}
                className={`cursor-pointer relative p-6 rounded-[32px] border-2 transition-all duration-300 flex flex-col gap-6 ${
                  isSelected 
                  ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-4 ring-primary/5' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Plano Ativo
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    {plan.iconName === 'zap' ? <Zap className="text-blue-500" /> : plan.iconName === 'rocket' ? <Rocket className="text-purple-500" /> : <ShieldCheck className="text-emerald-500" />}
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por mês</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">R$ {plan.price}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">{plan.name}</h4>
                  <div className="mt-4 space-y-3">
                    {(plan.features as string[] || []).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={16} className={isSelected ? 'text-primary' : 'text-slate-300'} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && !isActive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCheckout(plan.id); }}
                    disabled={checkoutMutation.isLoading || verifyMutation.isLoading}
                    className="mt-2 w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {checkoutMutation.isLoading || verifyMutation.isLoading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                    Assinar Agora
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Banner e Logo */}
            <div className="relative h-48 bg-slate-100 dark:bg-slate-950 group overflow-hidden">
              {formData?.banner_url ? (
                <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                  <ImageIcon size={48} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sem Banner</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Camera className="text-white" size={32} />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Banner</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
              </label>

              <div className="absolute -bottom-10 left-8 z-10">
                <label className="relative w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden cursor-pointer flex items-center justify-center group/logo">
                  {formData?.logo_url ? <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Camera className="text-slate-400" size={32} />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </label>
              </div>
            </div>

            <div className="p-8 pt-16 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Building2 size={12} className="text-primary" /> Nome do Restaurante</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText size={12} className="text-primary" /> Descrição</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Globe size={12} className="text-primary" /> Link do Cardápio</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">pedidoja.com/</span>
                    <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full pl-28 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MessageCircle size={12} className="text-primary" /> WhatsApp para Pedidos</label>
                  <input type="text" value={formData.whatsapp} onChange={(e) => handlePhoneChange(e, 'whatsapp')} className="w-full p-4 rounded-2xl border border-primary/20 bg-primary/5 outline-none font-black text-primary" />
                </div>
              </div>

              {/* Endereço Detalhado */}
              <div className="pt-8 border-t border-slate-50 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Endereço da Loja</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP</label>
                    <input 
                      type="text" 
                      value={formData.cep} 
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      onBlur={handleCEPBlur}
                      placeholder="00000-000"
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logradouro (Rua/Avenida)</label>
                    <input 
                      type="text" 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Complemento</label>
                    <input 
                      type="text" 
                      value={formData.complement} 
                      onChange={(e) => setFormData({...formData, complement: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bairro</label>
                    <input 
                      type="text" 
                      value={formData.neighborhood} 
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cidade</label>
                    <input 
                      type="text" 
                      value={formData.city} 
                      onChange={(e) => setFormData({...formData, city: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                    <input 
                      type="text" 
                      value={formData.state} 
                      onChange={(e) => setFormData({...formData, state: e.target.value})} 
                      maxLength={2}
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold uppercase" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <h3 className="text-lg font-bold dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
              <Clock size={20} className="text-primary" /> Horários
            </h3>
            <div className="space-y-4">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((dayId) => {
                const dayConfig = formData.opening_hours[dayId];
                const dayName = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' }[dayId];
                return (
                  <div key={dayId} className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{dayName}</span>
                      <button onClick={() => {
                        const updated = { ...formData.opening_hours };
                        updated[dayId].isOpen = !updated[dayId].isOpen;
                        setFormData({ ...formData, opening_hours: updated });
                      }} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${dayConfig.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {dayConfig.isOpen ? 'Aberto' : 'Fechado'}
                      </button>
                    </div>
                    {dayConfig.isOpen && (
                      <div className="flex items-center gap-2">
                        <input type="time" value={dayConfig.open} onChange={(e) => {
                          const updated = { ...formData.opening_hours };
                          updated[dayId].open = e.target.value;
                          setFormData({ ...formData, opening_hours: updated });
                        }} className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-xs font-bold dark:text-white" />
                        <span className="text-slate-300 font-bold text-xs">às</span>
                        <input type="time" value={dayConfig.close} onChange={(e) => {
                          const updated = { ...formData.opening_hours };
                          updated[dayId].close = e.target.value;
                          setFormData({ ...formData, opening_hours: updated });
                        }} className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleSave} disabled={updateMutation.isLoading} className="w-full py-5 bg-primary text-white rounded-[24px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            {updateMutation.isLoading ? <Loader2 className="animate-spin" /> : <Save />}
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
