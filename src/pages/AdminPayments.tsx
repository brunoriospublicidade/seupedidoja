import React from 'react';
import { motion } from 'framer-motion';
import { trpc } from '../lib/trpc';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Filter,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Loader2
} from 'lucide-react';

const AdminPaymentsPage = () => {
  const { data: stats, isLoading: loadingStats } = trpc.restaurants.getPlatformStats.useQuery();
  const { data: restaurants, isLoading: loadingStores } = trpc.restaurants.listAll.useQuery();

  if (loadingStats || loadingStores) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sincronizando com o Banco de Dados...</p>
      </div>
    );
  }

  const recentRestaurants = restaurants?.slice(0, 5) || [];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Pagamentos da Plataforma</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Visão geral financeira baseada em assinaturas reais e status de lojas.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
             <Download size={20} />
             Exportar Relatório
          </button>
        </div>
      </header>

      {/* Cards de Métricas Financeiras Reais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Receita Mensal (MRR)', value: `R$ ${stats?.mrr.toFixed(2)}`, trend: 'Tempo Real', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Assinaturas Pagas', value: stats?.paidSubscriptions || 0, trend: 'Ativas', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Em Período de Teste', value: stats?.trialSubscriptions || 0, trend: 'Aguardando', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total de Lojas', value: stats?.totalRestaurants || 0, trend: 'Cadastradas', icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/5' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} dark:bg-opacity-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                 <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela de Transações Recentes */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <CreditCard size={20} className="text-primary" /> Transações Recentes
                </h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver Todas</button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                     <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Loja</th>
                     <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Plano</th>
                     <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                     <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {recentRestaurants.map((res) => {
                     const amount = res.subscription_plan === 'gold' ? 49.90 : res.subscription_plan === 'prata' ? 29.90 : 9.90;
                     return (
                       <tr key={res.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                         <td className="px-8 py-5">
                            <div className="text-sm font-bold text-slate-800 dark:text-white">{res.name}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(res.created_at).toLocaleDateString('pt-BR')}
                            </div>
                         </td>
                         <td className="px-8 py-5">
                           <span className="text-xs font-medium text-slate-500 uppercase">{res.subscription_plan || 'bronze'}</span>
                         </td>
                         <td className="px-8 py-5">
                           <span className="text-sm font-black text-slate-800 dark:text-white">R$ {amount.toFixed(2)}</span>
                         </td>
                         <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                             res.subscription_plan !== 'bronze' 
                             ? 'bg-green-100 text-green-700' 
                             : 'bg-blue-100 text-blue-700'
                           }`}>
                             {res.subscription_plan !== 'bronze' ? 'Pago' : 'Trial'}
                           </span>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

        {/* Distribuição de Planos */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <PieChart size={20} className="text-primary" /> Distribuição
              </h3>
              
              <div className="space-y-6">
                 {[
                   { label: 'Plano Bronze (R$ 9,90)', percent: 65, color: 'bg-primary' },
                   { label: 'Plano Prata (R$ 29,90)', percent: 25, color: 'bg-blue-500' },
                   { label: 'Plano Gold (R$ 49,90)', percent: 10, color: 'bg-amber-500' },
                 ].map((item, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-500">{item.label}</span>
                         <span className="text-slate-800 dark:text-white">{item.percent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                 <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Previsão Próximo Mês</div>
                    <div className="text-lg font-black text-primary">R$ 1.840,00</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
