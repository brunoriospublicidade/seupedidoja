import React from 'react';
import { CreditCard, DollarSign, Download, Calendar, ExternalLink, ShieldCheck, Zap, Rocket, History, CheckCircle2, Loader2, CreditCard as CardIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

const PaymentsPage = () => {
  const { data: restaurant, isLoading: loadingRestaurant } = trpc.restaurants.get.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: billingInfo, isLoading: loadingBilling } = trpc.payments.getSubscriptionInfo.useQuery(
    { restaurantId: restaurant?.id || '' },
    { enabled: !!restaurant?.id }
  );

  const portalMutation = trpc.payments.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message)
  });

  const activePlan = plans?.find(p => p.id === restaurant?.subscription_plan);

  if (loadingRestaurant || loadingBilling) return <div className="p-8 text-center text-slate-400">Carregando informações financeiras...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Pagamentos e Assinatura</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie seu plano, faturas e métodos de pagamento reais via Stripe.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card do Plano Atual */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={120} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                {billingInfo?.hasActiveSubscription ? 'Assinatura Ativa' : 'Plano Gratuito / Pendente'}
              </span>
              <div>
                <h3 className="text-2xl font-black">{activePlan?.name || 'Sem Plano'}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black">R$ {activePlan?.price || '0,00'}</span>
                  <span className="text-white/60 text-sm font-bold">/mês</span>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 size={16} /> Recursos ilimitados
                </div>
                {billingInfo?.currentSubscription?.current_period_end && (
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Calendar size={14} /> Próximo ciclo: {new Date(billingInfo.currentSubscription.current_period_end * 1000).toLocaleDateString()}
                  </div>
                )}
              </div>

              <button 
                onClick={() => portalMutation.mutate({ restaurantId: restaurant?.id || '' })}
                disabled={portalMutation.isLoading}
                className="w-full py-4 bg-white text-primary rounded-[20px] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {portalMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : <ExternalLink size={20} />}
                Gerenciar no Stripe
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-6">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CardIcon size={18} className="text-primary" /> Cartão de Crédito
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para sua segurança, os dados do cartão são gerenciados diretamente pelo Stripe. Clique no botão acima para alterar ou remover cartões.
            </p>
          </div>
        </div>

        {/* Histórico de Faturas Reais */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History size={18} className="text-primary" /> Histórico de Faturamento Real
              </h4>
              <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                Stripe Sync
              </div>
            </div>
            
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {billingInfo?.invoices.length === 0 ? (
                <div className="p-20 text-center text-slate-300">
                  <p className="text-sm italic">Nenhuma fatura encontrada ainda.</p>
                </div>
              ) : (
                billingInfo?.invoices.map((inv) => (
                  <div key={inv.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 group-hover:text-primary transition-colors">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{inv.date}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">RECIBO #{inv.id.slice(-6)} • {inv.method}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-800 dark:text-white">{inv.amount}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-green-500">{inv.status}</div>
                      </div>
                      {inv.pdf && (
                        <a 
                          href={inv.pdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                        >
                          <Download size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
