import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingBag, 
  UtensilsCrossed, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  Store,
  Clock,
  ArrowRight
} from 'lucide-react';
import { trpc } from '../lib/trpc';

const AdminAnalyticsPage = () => {
  const { data: analytics, isLoading } = trpc.restaurants.getDetailedAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          Análise de Performance
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full flex items-center gap-1 font-black">
            <TrendingUp size={12} /> AO VIVO
          </span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Monitore o crescimento e a atividade de cada restaurante em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analytics?.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 space-y-6 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Store />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{item.foodType} • {item.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                item.subscriptionPlan === 'gold' ? 'bg-amber-100 text-amber-700' : 
                item.subscriptionPlan === 'prata' ? 'bg-blue-100 text-blue-700' : 
                'bg-slate-100 text-slate-500'
              }`}>
                {item.subscriptionPlan || 'bronze'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <ShoppingBag size={12} /> Pedidos
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-white">
                  {item.ordersCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <UtensilsCrossed size={12} /> Produtos
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-white">
                  {item.productsCount}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Faturamento Total</div>
                  <div className="text-2xl font-black text-emerald-500">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Cliente desde: <b>{new Date(item.createdAt!).toLocaleDateString('pt-BR')}</b></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  <span>Último pedido: <b>{item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleString('pt-BR') : 'Sem pedidos'}</b></span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.open(`/menu/${item.id}`, '_blank')}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-500 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn"
            >
              Ver Loja Pública
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
