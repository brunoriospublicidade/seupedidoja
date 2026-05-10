import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Calendar,
  ChevronRight,
  UserPlus,
  TrendingUp,
  MessageCircle,
  Star
} from 'lucide-react';

const CustomersPage = () => {
  const [, setLocation] = useLocation();
  const { data: realCustomers, isLoading } = trpc.customers.list.useQuery();
  
  // Usar dados reais se existirem, senão uma lista vazia para mostrar o estado "Nenhum cliente"
  const customers = realCustomers || [];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             Clientes <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{customers.length} total</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie a base de clientes que fazem pedidos no seu restaurante.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Buscar cliente..." 
               className="pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all w-full md:w-64"
             />
          </div>
          <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-colors">
             <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Stats Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Novos (30 dias)', value: '12', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Clientes Fiéis', value: '8', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Ticket Médio', value: 'R$ 54,20', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 ${stat.bg} dark:bg-opacity-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
               <stat.icon size={28} />
            </div>
            <div>
               <div className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Pedidos / Gasto</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Último Pedido</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {customers.map((customer: any) => (
                <tr key={customer.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                        {customer.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{customer.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase"><Mail size={10}/> {customer.email}</div>
                           <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase"><Phone size={10}/> {customer.phone}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <ShoppingBag size={14} className="text-slate-400" />
                          {customer.total_orders || 0} pedidos
                       </div>
                       <div className="text-xs font-black text-emerald-500">R$ {(Number(customer.total_spent) || 0).toFixed(2)}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar size={14} />
                        {customer.last_order ? new Date(customer.last_order).toLocaleDateString('pt-BR') : 'Sem pedidos'}
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      customer.status === 'Fiel' 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' 
                      : customer.status === 'Ativo' || !customer.status
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                      {customer.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" 
                        title="WhatsApp"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button 
                        onClick={() => setLocation('/admin/mala-direta')}
                        className="p-2 text-slate-300 hover:text-primary transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="p-20 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-[30px] flex items-center justify-center mx-auto text-slate-200">
                <Users size={40} />
             </div>
             <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-white">Nenhum cliente ainda</h4>
                <p className="text-slate-400 text-sm">Os clientes aparecerão aqui assim que fizerem o primeiro pedido.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
