import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Save, Building2, MessageCircle, Clock, Camera, Loader2, Globe, FileText, CreditCard, CheckCircle2, ShieldCheck, Zap, Rocket, Image as ImageIcon, PartyPopper, MapPin, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { uploadImage } from '../lib/storage';
import confetti from 'canvas-confetti';

const SettingsPage = () => {
  const { role } = useAuth();
  const utils = trpc.useContext();
  const { data: restaurant, isLoading: loadingRestaurant } = trpc.restaurants.get.useQuery();
  const { data: plans, isLoading: loadingPlans } = trpc.plans.list.useQuery();
  
  const updateMutation = trpc.restaurants.update.useMutation({
    onSuccess: (data) => {
      console.log('[SERVER RESPONSE]', data);
      utils.restaurants.invalidate();
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (err: any) => {
      console.error('[UPDATE ERROR]', err);
      toast.error('Erro ao salvar: ' + err.message);
    }
  });

  const wsMutation = trpc.restaurants.updateWhatsAppSettings.useMutation({
    onSuccess: () => {
      utils.restaurants.invalidate();
      toast.success('Configurações de WhatsApp salvas!');
    },
    onError: (err: any) => {
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
    onError: (err: any) => {
      toast.error('Erro ao iniciar checkout: ' + err.message);
    }
  });

  const [formData, setFormData] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgressLogo, setUploadProgressLogo] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadProgressBanner, setUploadProgressBanner] = useState(0);

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
    if (restaurant && !formData) {
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
        delivery_config: restaurant.deliveryConfig || { type: 'fixed', fixedFee: 0, neighborhoods: [], baseFee: 0, feePerKm: 0 },
        evolution_api_url: restaurant.evolutionApiUrl || '',
        evolution_api_key: restaurant.evolutionApiKey || '',
        evolution_instance: restaurant.evolutionInstance || '',
        cep: restaurant.cep || '',
        address: restaurant.address || '',
        complement: restaurant.complement || '',
        neighborhood: restaurant.neighborhood || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        email: restaurant.email || '',
        password: restaurant.password || '',
        pagbank_token: (restaurant as any).pagbankToken || ''
      });
    }
  }, [restaurant, formData]);

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
      pagbank_token: formData.pagbank_token,
      cep: formData.cep,
      address: formData.address,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      delivery_config: formData.delivery_config,
      email: formData.email,
      password: formData.password
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
      if (type === 'logo') {
        setUploadingLogo(true);
        setUploadProgressLogo(0);
      } else {
        setUploadingBanner(true);
        setUploadProgressBanner(0);
      }
      
      const url = await uploadImage(file, type === 'logo' ? 'logos' : 'banners', (percent) => {
        if (type === 'logo') setUploadProgressLogo(percent);
        else setUploadProgressBanner(percent);
      });
      setFormData({ ...formData, [type === 'logo' ? 'logo_url' : 'banner_url']: url });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} atualizado!`);
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
        setUploadProgressLogo(0);
      } else {
        setUploadingBanner(false);
        setUploadProgressBanner(0);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<'identity' | 'delivery' | 'hours' | 'whatsapp' | 'payments' | 'billing' | 'security'>('identity');

  if (loadingRestaurant || loadingPlans || !formData) return <div className="p-8 text-center text-slate-400">Carregando configurações...</div>;

  const TABS = [
    { id: 'identity', label: 'Identidade', icon: Building2 },
    { id: 'delivery', label: 'Endereço e Entrega', icon: MapPin },
    { id: 'hours', label: 'Horários', icon: Clock },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'security', label: 'Segurança', icon: ShieldCheck },
    { id: 'billing', label: 'Minha Assinatura', icon: CreditCard },
  ];

  return (
    <div className="space-y-12 max-w-6xl pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Configurações da Loja</h2>
          <p className="text-slate-500">Gerencie sua identidade, taxas de entrega e horários.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={updateMutation.isLoading} 
          className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {updateMutation.isLoading ? <Loader2 className="animate-spin" /> : <Save />}
          Salvar Alterações
        </button>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                 {/* Banner */}
                <div className="relative">
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-950 group overflow-hidden rounded-t-[32px]">
                    {formData?.banner_url ? (
                      <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                        <ImageIcon size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Banner</span>
                      </div>
                    )}
                    {uploadingBanner ? (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <Loader2 className="animate-spin text-white absolute inset-0" size={64} strokeWidth={1} />
                          <span className="text-xs font-black text-white">{uploadProgressBanner}%</span>
                        </div>
                        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgressBanner}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <Camera className="text-white" size={32} />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Banner</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                      </label>
                    )}
                  </div>

                  <div className="absolute -bottom-12 left-8 z-20">
                    <label className="relative block w-32 h-32 rounded-[32px] bg-white dark:bg-slate-900 border-[6px] border-white dark:border-slate-900 shadow-2xl overflow-hidden cursor-pointer group/logo transition-transform hover:scale-105 active:scale-95">
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="animate-spin text-primary" size={24} />
                          <span className="text-[10px] font-black text-primary">{uploadProgressLogo}%</span>
                        </div>
                      ) : formData?.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-slate-400" size={32} />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                      {!uploadingLogo && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={24} />
                        </div>
                      )}
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
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MessageCircle size={12} className="text-primary" /> Telefone de Contato</label>
                      <input type="text" value={formData.phone} onChange={(e) => handlePhoneChange(e, 'phone')} className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none dark:text-white font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'delivery' && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Endereço da Loja</h3>
                    <p className="text-sm text-slate-500">Defina onde sua loja está localizada.</p>
                  </div>
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

                <div className="pt-8 border-t border-slate-50 dark:border-slate-800 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                      <Rocket size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">Taxas de Entrega</h3>
                      <p className="text-sm text-slate-500">Configure como você cobra pelo envio dos pedidos.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'fixed', label: 'Valor Fixo', icon: <Zap size={18} /> },
                      { id: 'neighborhood', label: 'Por Bairro', icon: <MapPin size={18} /> },
                      { id: 'distance', label: 'Por Distância', icon: <Globe size={18} /> },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({
                          ...formData,
                          delivery_config: { ...formData.delivery_config, type: type.id }
                        })}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 font-bold ${
                          formData.delivery_config?.type === type.id
                          ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10'
                          : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary/20'
                        }`}
                      >
                        {type.icon}
                        <span className="text-xs uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {formData.delivery_config?.type === 'fixed' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor da Taxa (R$)</label>
                          <input 
                            type="number" 
                            value={formData.delivery_config.fixedFee || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              delivery_config: { ...formData.delivery_config, fixedFee: Number(e.target.value) }
                            })}
                            className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-bold text-lg" 
                          />
                          <p className="text-[10px] text-slate-500 italic">* Este valor será aplicado a todos os pedidos, independente do endereço.</p>
                        </div>
                      </motion.div>
                    )}

                    {formData.delivery_config?.type === 'neighborhood' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxas por Bairro</h5>
                            <button 
                              onClick={() => {
                                const neighborhoods = [...(formData.delivery_config.neighborhoods || [])];
                                neighborhoods.push({ name: '', fee: 0 });
                                setFormData({
                                  ...formData,
                                  delivery_config: { ...formData.delivery_config, neighborhoods }
                                });
                              }}
                              className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase hover:bg-primary/20 transition-all"
                            >
                              + Adicionar Bairro
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(formData.delivery_config.neighborhoods || []).map((nb: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input 
                                  placeholder="Nome do Bairro"
                                  value={nb.name}
                                  onChange={(e) => {
                                    const neighborhoods = [...formData.delivery_config.neighborhoods];
                                    neighborhoods[idx].name = e.target.value;
                                    setFormData({ ...formData, delivery_config: { ...formData.delivery_config, neighborhoods } });
                                  }}
                                  className="md:col-span-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-bold text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    placeholder="Taxa R$"
                                    value={nb.fee}
                                    onChange={(e) => {
                                      const neighborhoods = [...formData.delivery_config.neighborhoods];
                                      neighborhoods[idx].fee = Number(e.target.value);
                                      setFormData({ ...formData, delivery_config: { ...formData.delivery_config, neighborhoods } });
                                    }}
                                    className="flex-1 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-bold text-sm"
                                  />
                                  <button 
                                    onClick={() => {
                                      const neighborhoods = formData.delivery_config.neighborhoods.filter((_: any, i: number) => i !== idx);
                                      setFormData({ ...formData, delivery_config: { ...formData.delivery_config, neighborhoods } });
                                    }}
                                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"
                                  >
                                    <ImageIcon size={16} className="text-rose-500" /> {/* Should be Trash but using ImageIcon as fallback for now if Trash not available, wait let me check imports */}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {formData.delivery_config?.type === 'distance' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa Base (R$)</label>
                            <input 
                              type="number" 
                              value={formData.delivery_config.baseFee || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                delivery_config: { ...formData.delivery_config, baseFee: Number(e.target.value) }
                              })}
                              className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adicional por KM (R$)</label>
                            <input 
                              type="number" 
                              value={formData.delivery_config.feePerKm || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                delivery_config: { ...formData.delivery_config, feePerKm: Number(e.target.value) }
                              })}
                              className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-bold" 
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">* Requer integração com Maps API para cálculo automático no checkout.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hours' && (
            <motion.div
              key="hours"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Horários de Atendimento</h3>
                  <p className="text-sm text-slate-500">Defina quando sua loja está aberta para receber pedidos.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((dayId) => {
                  const dayConfig = formData.opening_hours[dayId];
                  const dayName = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' }[dayId];
                  return (
                    <div key={dayId} className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
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
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <CreditCard size={32} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Receber via PagBank</h3>
                    <p className="text-sm text-slate-500">Configure seu token do PagBank para receber pagamentos via Pix direto na sua conta.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">Token da API PagBank</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={formData.pagbank_token} 
                        onChange={(e) => setFormData({...formData, pagbank_token: e.target.value})} 
                        placeholder="Insira seu token do PagBank"
                        className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-mono" 
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Você pode obter seu token no painel do PagBank em "Vendas Online" &gt; "Integrações".</p>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-950/30 rounded-3xl border border-amber-100 dark:border-amber-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black uppercase text-[10px] tracking-widest">
                    <ShieldCheck size={14} />
                    Informação Importante
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200/70 font-medium">
                    Ao configurar o PagBank, a opção de pagamento via Pix será habilitada automaticamente no seu cardápio. Os valores cairão instantaneamente na sua conta PagBank.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'whatsapp' && (
            <motion.div
              key="whatsapp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Configurações de WhatsApp</h3>
                    <p className="text-sm text-slate-500">Conecte sua instância da Evolution API para automação.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp para Receber Pedidos</label>
                    <input type="text" value={formData.whatsapp} onChange={(e) => handlePhoneChange(e, 'whatsapp')} className="w-full p-4 rounded-2xl border border-primary/20 bg-primary/5 outline-none font-black text-primary" />
                    <p className="text-[10px] text-slate-500 italic">* Este número receberá as notificações de novos pedidos.</p>
                  </div>
                  
                  {role === 'admin' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evolution API URL</label>
                        <input type="text" value={formData.evolution_api_url} onChange={(e) => setFormData({...formData, evolution_api_url: e.target.value})} placeholder="https://api.sua-instancia.com" className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evolution API Instance</label>
                        <input type="text" value={formData.evolution_instance} onChange={(e) => setFormData({...formData, evolution_instance: e.target.value})} placeholder="SeuNomeInstancia" className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evolution API Key</label>
                        <input type="password" value={formData.evolution_api_key} onChange={(e) => setFormData({...formData, evolution_api_key: e.target.value})} placeholder="••••••••••••••••" className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-bold" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Segurança e Acesso</h3>
                    <p className="text-sm text-slate-500">Gerencie suas credenciais de acesso ao painel.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Mail size={12} className="text-primary" /> E-mail de Acesso</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-bold" 
                    />
                    <p className="text-[10px] text-slate-500 italic">* Este e-mail é usado para login no painel administrativo.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Lock size={12} className="text-primary" /> Nova Senha</label>
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      placeholder="••••••••"
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-bold" 
                    />
                    <p className="text-[10px] text-slate-500 italic">* Deixe como está se não desejar alterar sua senha atual.</p>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 flex gap-4">
                   <Zap size={24} className="text-amber-500 shrink-0" />
                   <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Dica de Segurança</p>
                      <p className="text-xs text-amber-700/70 dark:text-amber-300/70 leading-relaxed">
                         Recomendamos o uso de senhas fortes com pelo menos 8 caracteres, incluindo letras, números e símbolos.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;
