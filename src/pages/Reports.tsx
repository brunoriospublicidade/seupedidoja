import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Filter,
  TrendingUp
} from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { trpc } from '../lib/trpc';

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const ReportsPage = () => {
  const { data: statsData, isLoading: loadingStats } = trpc.orders.getStats.useQuery();
  const { data: customersData, isLoading: loadingCustomers } = trpc.customers.list.useQuery();

  if (loadingStats || loadingCustomers || !statsData) {
    return <div className="p-8 text-center text-slate-400">Carregando relatórios...</div>;
  }

  const ordersList = statsData.data || [];
  const totalRevenue = statsData.totalRevenue || 0;
  const totalOrders = statsData.totalOrders || 0;
  const totalCustomers = customersData?.length || 0;

  // 1. Faturamento por Dia da Semana (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const dailyData = daysOfWeek.map(day => ({ name: day, sales: 0, orders: 0 }));

  ordersList.forEach((order: any) => {
    const date = new Date(order.createdAt);
    const dayIndex = date.getDay(); // 0 = Dom, 1 = Seg...
    const targetIdx = dayIndex === 0 ? 6 : dayIndex - 1;
    if (targetIdx >= 0 && targetIdx < 7) {
      dailyData[targetIdx].sales += Number(order.total || 0);
      dailyData[targetIdx].orders += 1;
    }
  });

  // 2. Top Produtos Vendidos
  const productSales: Record<string, number> = {};
  ordersList.forEach((order: any) => {
    let items: any[] = [];
    if (typeof order.items === 'string') {
      try { items = JSON.parse(order.items); } catch { items = []; }
    } else if (Array.isArray(order.items)) {
      items = order.items;
    }
    
    items.forEach((item: any) => {
      const name = item.name || 'Produto';
      const qty = Number(item.quantity) || 1;
      productSales[name] = (productSales[name] || 0) + qty;
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const chartProducts = topProducts.length > 0 ? topProducts : [
    { name: 'Nenhum item vendido', value: 0 }
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Relatórios e Análises</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Visualize o desempenho e tendências do seu negócio.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button className="px-5 py-2 text-slate-400 font-bold text-xs">7 Dias</button>
            <button className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20">30 Dias</button>
            <button className="px-5 py-2 text-slate-400 font-bold text-xs">Ano</button>
          </div>
          <button className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-3xl font-black dark:text-white">R$ {totalRevenue.toFixed(2)}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Faturamento Bruto</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="text-3xl font-black dark:text-white">{totalOrders}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Total de Pedidos</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <div className="text-3xl font-black dark:text-white">{totalCustomers}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Clientes Cadastrados</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Faturamento Semanal */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
              <Calendar size={20} className="text-primary" /> Faturamento por Dia
            </h3>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#F59E0B" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Produtos Mais Vendidos */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
              <TrendingUp size={20} className="text-primary" /> Top Produtos
            </h3>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 'bold'}} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pedidos por Período */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
              <ShoppingBag size={20} className="text-primary" /> Volume de Pedidos
            </h3>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Line type="stepAfter" dataKey="orders" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Categoria */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
              <TrendingUp size={20} className="text-primary" /> Mix de Vendas
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-center" style={{ minHeight: 300 }}>
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {chartProducts.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate block max-w-[120px]" title={entry.name}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
