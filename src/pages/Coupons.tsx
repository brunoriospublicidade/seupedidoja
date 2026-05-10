import React, { useState } from 'react';
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign, Loader2, X, PlusCircle, CheckCircle2, AlertCircle, Calendar, Hash, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

const CouponsPage = () => {
  const utils = trpc.useContext();
  const { data: restaurant } = trpc.restaurants.get.useQuery();
  const { data: coupons, isLoading } = trpc.coupons.list.useQuery(
    { restaurantId: restaurant?.id || '' },
    { enabled: !!restaurant?.id }
  );

  const createMutation = trpc.coupons.create.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Cupom criado com sucesso!');
    }
  });

  const toggleMutation = trpc.coupons.toggleStatus.useMutation({
    onSuccess: () => utils.coupons.list.invalidate()
  });

  const deleteMutation = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success('Cupom excluído!');
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    expires_at: '',
    usage_limit: '' as string | number
  });

  const resetForm = () => {
    setFormData({ code: '', type: 'percentage', value: 0, expires_at: '', usage_limit: '' });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.value <= 0) return toast.error('Preencha todos os campos corretamente');
    
    createMutation.mutate({
      ...formData,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
      expires_at: formData.expires_at || undefined,
      restaurant_id: restaurant?.id || ''
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Carregando cupons...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Cupons de Desconto</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Crie promoções e fidelize seus clientes com descontos exclusivos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={20} />
          Novo Cupom
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons?.length === 0 ? (
          <div className="md:col-span-3 py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Ticket size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-400">Nenhum cupom ativo</h3>
              <p className="text-xs text-slate-500">Comece criando seu primeiro desconto!</p>
            </div>
          </div>
        ) : (
          coupons?.map((coupon) => (
            <motion.div
              layout
              key={coupon.id}
              className={`p-6 rounded-[32px] border-2 transition-all duration-300 flex flex-col gap-6 relative overflow-hidden group ${
                coupon.active 
                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-950 border-transparent opacity-60'
              }`}
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${coupon.active ? 'bg-primary/20' : 'bg-slate-200'}`} />

              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${coupon.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                  <Ticket size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: coupon.id, active: !coupon.active })}
                    className={`p-2 transition-colors ${coupon.active ? 'text-primary' : 'text-slate-400'}`}
                  >
                    {coupon.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate({ id: coupon.id })}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{coupon.code}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-primary">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value}`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">de desconto</span>
                </div>
              </div>

              <div className="space-y-3">
                {coupon.usageLimit && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5"><Hash size={12} className="text-slate-300" /> Uso</span>
                    <span>{coupon.usageCount} / {coupon.usageLimit}</span>
                  </div>
                )}
                {coupon.expiresAt && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> Vencimento</span>
                    <span className={new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : ''}>
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${coupon.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {coupon.active ? 'Ativo' : 'Desativado'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium italic">Seu Pedido Já Promo</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Configurar Promoção</h3>
                    <p className="text-xs text-slate-400">Personalize as regras do seu cupom</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Código do Cupom</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="EX: LOUCURA20"
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black text-xl tracking-tighter dark:text-white uppercase" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Valor do Desconto</label>
                    <input 
                      type="number" 
                      value={formData.value || ''} 
                      onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2"><Calendar size={12} /> Validade (Opcional)</label>
                    <input 
                      type="date" 
                      value={formData.expires_at} 
                      onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2"><Hash size={12} /> Limite de Uso (Opcional)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 50"
                      value={formData.usage_limit} 
                      onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white" 
                    />
                  </div>
                </div>

                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 flex gap-3">
                  <Info size={20} className="text-amber-500 shrink-0" />
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    Dica: Limitar o uso por quantidade cria o senso de urgência ("Gatilho de Escassez") nos seus clientes.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar</button>
                  <button 
                    type="submit" 
                    disabled={createMutation.isLoading}
                    className="flex-[2] py-4 bg-primary text-white rounded-[20px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {createMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    Salvar Promoção
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponsPage;
