import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  Filter,
  RefreshCcw,
  Bike
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusColors: any = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  preparing: { label: 'Em Preparo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  shipped: { label: 'Em Entrega', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
};

const OrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const utils = trpc.useContext();
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const updateStatus = trpc.orders.updateStatus?.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast.success('Status atualizado!');
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ShoppingBag className="text-primary" size={32} /> Gestão de Pedidos
          </h1>
          <p className="text-slate-500 font-medium">Acompanhe e gerencie os pedidos em tempo real.</p>
        </div>
        <button 
          onClick={() => utils.orders.list.invalidate()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
        >
          <RefreshCcw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          {orders?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag size={32} />
              </div>
              <p className="text-slate-500 font-bold">Nenhum pedido recebido ainda.</p>
            </div>
          ) : (
            orders?.map((order: any) => (
              <motion.div 
                key={order.id}
                layoutId={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white dark:bg-slate-900 border ${selectedOrder?.id === order.id ? 'border-primary ring-4 ring-primary/10' : 'border-slate-100 dark:border-white/5'} p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all group`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-black">
                      #{order.id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                        {order.customer?.name || 'Cliente'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{order.items.length} itens</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="font-black text-slate-800 dark:text-white">R$ {Number(order.total).toFixed(2).replace('.', ',')}</div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${statusColors[order.status]?.color}`}>
                        {statusColors[order.status]?.label}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Order Details Panel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[40px] p-8 shadow-2xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">Detalhes do Pedido</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><XCircle size={20} /></button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl"><User size={20} /></div>
                      <div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</div>
                        <div className="font-bold text-slate-800 dark:text-white">{selectedOrder.customer?.name}</div>
                        <div className="text-sm text-slate-500">{selectedOrder.customer?.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl"><MapPin size={20} /></div>
                      <div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrega</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">{selectedOrder.customer?.address || 'Retirada no Local'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-4">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Itens do Pedido</div>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-800 dark:text-white"><span className="text-primary">{item.quantity}x</span> {item.name}</span>
                          <span className="font-medium text-slate-500">R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                      <span className="font-black text-slate-800 dark:text-white">Total</span>
                      <span className="text-xl font-black text-primary">R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mudar Status</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase hover:bg-blue-100 transition-colors">Preparar</button>
                      <button className="p-3 bg-purple-50 text-purple-600 rounded-2xl text-xs font-black uppercase hover:bg-purple-100 transition-colors">Despachar</button>
                      <button className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase hover:bg-emerald-100 transition-colors col-span-2">Finalizar</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="sticky top-8 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[40px] p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <Filter size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm">Selecione um pedido para ver os detalhes e gerenciar o status.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
