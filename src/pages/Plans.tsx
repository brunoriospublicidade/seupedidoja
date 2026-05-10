import React, { useState } from 'react';
import { ShieldCheck, Zap, Rocket, Plus, CheckCircle2, Edit3, Trash2, X, Save, Loader2, PlusCircle, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

const PlansPage = () => {
  const utils = trpc.useContext();
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const updateMutation = trpc.plans.update.useMutation({
    onSuccess: () => {
      utils.plans.list.invalidate();
      setIsModalOpen(false);
      toast.success('Plano atualizado com sucesso!');
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const handleEdit = (plan: any) => {
    setEditingPlan({ 
      id: plan.id,
      name: plan.name,
      price: plan.price,
      stripe_price_id: plan.stripePriceId || '',
      features: plan.features || []
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingPlan.name || !editingPlan.price) {
      return toast.error('Nome e preço são obrigatórios');
    }
    updateMutation.mutate(editingPlan);
  };

  const addFeature = () => {
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = editingPlan.features.filter((_: any, i: number) => i !== index);
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'zap': return <Zap className="text-blue-500" size={24} />;
      case 'rocket': return <Rocket className="text-purple-500" size={24} />;
      case 'shield': return <ShieldCheck className="text-emerald-500" size={24} />;
      default: return <Zap className="text-primary" size={24} />;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Carregando planos...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Configuração de Planos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie os preços e benefícios de cada nível de assinatura.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans?.map((plan) => (
          <motion.div 
            key={plan.id} 
            layoutId={plan.id}
            className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col gap-8 relative group"
          >
            <div className="flex justify-between items-start">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl group-hover:bg-primary/10 transition-colors">
                {getIcon(plan.iconName || 'zap')}
              </div>
              <button 
                onClick={() => handleEdit(plan)}
                className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-primary rounded-xl transition-all"
              >
                <Edit3 size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-400 uppercase">R$</span>
                <span className="text-4xl font-black text-slate-800 dark:text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm font-bold">/mês</span>
              </div>
              {plan.stripePriceId ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-lg w-fit">
                  <CreditCard size={10} /> Vinculado ao Stripe
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-1 rounded-lg w-fit">
                  <ShieldCheck size={10} /> Sem ID do Stripe
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">Recursos Inclusos</p>
              {(plan.features as string[] || []).map((feature: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de Edição */}
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
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                    {getIcon(editingPlan?.iconName || editingPlan?.icon_name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Editar {editingPlan?.name}</h3>
                    <p className="text-xs text-slate-400">ID Interno: {editingPlan?.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome do Plano</label>
                    <input 
                      type="text" 
                      value={editingPlan?.name} 
                      onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Preço Visível (R$)</label>
                    <input 
                      type="text" 
                      value={editingPlan?.price} 
                      onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Stripe Price ID (price_...)</label>
                  <input 
                    type="text" 
                    placeholder="price_1P..."
                    value={editingPlan?.stripe_price_id || ''} 
                    onChange={(e) => setEditingPlan({...editingPlan, stripe_price_id: e.target.value})}
                    className="w-full p-4 bg-primary/5 border border-primary/20 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm dark:text-white" 
                  />
                  <p className="text-[10px] text-slate-400 px-1 italic">Este ID vincula o botão de assinatura ao produto no Stripe.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Recursos e Benefícios</label>
                    <button onClick={addFeature} className="text-primary hover:text-primary/80 transition-colors">
                      <PlusCircle size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingPlan?.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex gap-2 group">
                        <input 
                          type="text" 
                          value={feature} 
                          onChange={(e) => updateFeature(idx, e.target.value)}
                          className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium dark:text-white" 
                        />
                        <button 
                          onClick={() => removeFeature(idx)}
                          className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={updateMutation.isLoading}
                  className="flex-[2] py-4 bg-primary text-white rounded-[20px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updateMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlansPage;
