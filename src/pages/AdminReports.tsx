import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Globe,
  Zap,
  MousePointer2,
  PieChart
} from 'lucide-react';

const AdminReportsPage = () => {
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Relatórios da Plataforma</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Métricas de crescimento, engajamento e performance global do ecossistema.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex">
           <button className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20">30 Dias</button>
           <button className="px-5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl font-bold text-xs transition-all">90 Dias</button>
           <button className="px-5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl font-bold text-xs transition-all">Todo o Período</button>
        </div>
      </header>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total de Pedidos', value: '1.450', trend: '+15.4%', icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Novos Restaurantes', value: '24', trend: '+8.2%', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Clientes Únicos', value: '8.920', trend: '+22.1%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Conversão Média', value: '3.8%', trend: '-0.2%', icon: MousePointer2, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                 <stat.icon size={28} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {stat.trend}
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</div>
            
            {/* Gráfico Sparkline Simulado */}
            <div className="mt-6 h-8 w-full flex items-end gap-1">
               {[40, 70, 45, 90, 65, 80, 50, 100].map((h, j) => (
                 <div key={j} className={`flex-1 rounded-t-sm ${stat.color.replace('text-', 'bg-')} opacity-20`} style={{ height: `${h}%` }} />
               ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Crescimento */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
               <TrendingUp size={24} className="text-primary" /> Crescimento de Vendas
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensal</span>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 pt-10">
             {[
               { m: 'Jan', v: 45 }, { m: 'Fev', v: 60 }, { m: 'Mar', v: 55 }, 
               { m: 'Abr', v: 85 }, { m: 'Mai', v: 100 }, { m: 'Jun', v: 80 }
             ].map((item, idx) => (
               <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full bg-primary/10 rounded-2xl relative overflow-hidden flex items-end" style={{ height: '200px' }}>
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${item.v}%` }}
                       transition={{ delay: idx * 0.1, duration: 1 }}
                       className="w-full bg-primary rounded-2xl shadow-lg shadow-primary/20 group-hover:brightness-110 transition-all"
                     />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400">{item.m}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Distribuição por Categoria de Restaurante */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
               <PieChart size={24} className="text-primary" /> Nichos Populares
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Market Share</span>
          </div>

          <div className="space-y-6">
             {[
               { label: 'Hamburguerias', count: 42, color: 'bg-primary' },
               { label: 'Pizzarias', count: 28, color: 'bg-blue-500' },
               { label: 'Sushi & Oriental', count: 15, color: 'bg-purple-500' },
               { label: 'Outros', count: 15, color: 'bg-slate-300' },
             ].map((item, idx) => (
               <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                     <span className="text-xs font-black text-slate-900 dark:text-white">{item.count}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800">
                     <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.count}%` }} />
                  </div>
               </div>
             ))}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="text-[10px] font-black uppercase text-slate-400">Mais Ativo</div>
                <div className="text-sm font-black text-primary">🍔 Hamburguerias</div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="text-[10px] font-black uppercase text-slate-400">Melhor Retenção</div>
                <div className="text-sm font-black text-emerald-500">🍕 Pizzarias</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
