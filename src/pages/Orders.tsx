import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  User, 
  Phone, 
  MapPin,
  RefreshCcw,
  Bike,
  ChefHat,
  PackageCheck,
  Bell,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig: any = {
  pending: { label: 'Novos', color: 'bg-rose-500', icon: <Bell size={18} />, textColor: 'text-rose-500' },
  received: { label: 'Recebidos', color: 'bg-amber-500', icon: <CheckCircle2 size={18} />, textColor: 'text-amber-500' },
  preparing: { label: 'Em Preparo', color: 'bg-blue-500', icon: <ChefHat size={18} />, textColor: 'text-blue-500' },
  shipped: { label: 'Em Entrega', color: 'bg-purple-500', icon: <Bike size={18} />, textColor: 'text-purple-500' },
  delivered: { label: 'Finalizados', color: 'bg-emerald-500', icon: <PackageCheck size={18} />, textColor: 'text-emerald-500' },
};

const OrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utils = trpc.useContext();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, {
    refetchInterval: 10000, // Polling a cada 10 segundos
  });

  const [prevOrdersCount, setPrevOrdersCount] = useState(0);

  // Sistema de som para novos pedidos
  useEffect(() => {
    if (orders && orders.length > prevOrdersCount) {
      const hasNewPending = orders.some((o: any) => o.status === 'pending' && !orders.find((old: any) => old.id === o.id));
      if (hasNewPending) {
        audioRef.current?.play().catch(e => console.log('Som bloqueado pelo navegador:', e));
        toast('🔔 Novo pedido recebido!', {
          description: 'Um novo pedido acaba de chegar na cozinha.',
          duration: 10000,
        });
      }
    }
    setPrevOrdersCount(orders?.length || 0);
  }, [orders, prevOrdersCount]);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: (data) => {
      utils.orders.list.invalidate();
      if (selectedOrder?.id === data?.id) {
        setSelectedOrder(data);
      }
      toast.success('Status atualizado!');
    },
    onError: (err) => {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen -mt-20">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getOrdersByStatus = (status: string) => {
    return orders?.filter((o: any) => o.status === status) || [];
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ShoppingBag className="text-primary" size={32} /> Painel de Pedidos
          </h1>
          <p className="text-slate-500 font-medium text-sm">Gerencie sua cozinha com fluxo Kanban em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => utils.orders.list.invalidate()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCcw size={16} /> Atualizar Agora
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          {Object.entries(statusConfig).map(([status, config]: [string, any]) => (
            <div key={status} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${config.color} text-white rounded-lg flex items-center justify-center shadow-lg shadow-${status}/20`}>
                    {config.icon}
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">{config.label}</h3>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2 py-1 rounded-md">
                  {getOrdersByStatus(status).length}
                </span>
              </div>

              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/30 rounded-[32px] p-4 space-y-4 overflow-y-auto border border-slate-100 dark:border-white/5 shadow-inner">
                <AnimatePresence>
                  {getOrdersByStatus(status).map((order: any) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedOrder(order)}
                      className={`group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border-2 ${selectedOrder?.id === order.id ? 'border-primary' : 'border-transparent'} cursor-pointer hover:shadow-md transition-all relative overflow-hidden`}
                    >
                      {status === 'pending' && <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 animate-ping rounded-full m-3" />}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors truncate">
                          {order.customer?.name || 'Cliente sem nome'}
                        </div>

                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && <div className="text-[9px] text-primary font-black uppercase tracking-widest">+ {order.items.length - 2} itens</div>}
                        </div>

                        <div className="pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                          <div className="font-black text-slate-900 dark:text-white">R$ {Number(order.total).toFixed(2)}</div>
                          <div className="flex gap-1">
                             {status === 'pending' && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ orderId: order.id, status: 'received' }); }}
                                 className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                                 title="Aceitar Pedido"
                               >
                                 <ArrowRight size={16} />
                               </button>
                             )}
                             {status === 'received' && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ orderId: order.id, status: 'preparing' }); }}
                                 className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                 title="Iniciar Preparo"
                               >
                                 <ArrowRight size={16} />
                               </button>
                             )}
                             {status === 'preparing' && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ orderId: order.id, status: 'shipped' }); }}
                                 className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                 title="Sair para Entrega"
                               >
                                 <ArrowRight size={16} />
                               </button>
                             )}
                             {status === 'shipped' && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ orderId: order.id, status: 'delivered' }); }}
                                 className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                 title="Finalizar"
                               >
                                 <ArrowRight size={16} />
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {getOrdersByStatus(status).length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-20 opacity-50">
                      <ShoppingBag size={40} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4">Vazio</p>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Lateral de Detalhes */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Pedido #{selectedOrder.id.slice(-4).toUpperCase()}</span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Detalhes do Pedido</h2>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><User size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                      <p className="font-bold text-slate-800 dark:text-white">{selectedOrder.customer?.name}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</p>
                      <p className="font-bold text-slate-800 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                    <p className="font-bold text-slate-800 dark:text-white leading-relaxed">{selectedOrder.customer?.address || 'Retirada no Local'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Itens do Pedido</h3>
                  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-5 border-b border-slate-50 dark:border-white/5 last:border-0 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white"><span className="text-primary">{item.quantity}x</span> {item.name}</p>
                          {item.observation && <p className="text-xs text-slate-400 italic">Obs: {item.observation}</p>}
                        </div>
                        <p className="font-black text-slate-800 dark:text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <p className="font-black text-slate-800 dark:text-white uppercase tracking-widest">Total do Pedido</p>
                      <p className="text-2xl font-black text-primary">R$ {Number(selectedOrder.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                   <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">Ações do Pedido</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {selectedOrder.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: 'received' })}
                          className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 col-span-2"
                        >
                          <CheckCircle2 size={20} /> Receber Pedido
                        </button>
                      )}
                      {selectedOrder.status === 'received' && (
                        <button 
                          onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: 'preparing' })}
                          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 col-span-2"
                        >
                          <ChefHat size={20} /> Iniciar Preparo
                        </button>
                      )}
                      {selectedOrder.status === 'preparing' && (
                        <button 
                          onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: 'shipped' })}
                          className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 col-span-2"
                        >
                          <Bike size={20} /> Sair para Entrega
                        </button>
                      )}
                      {selectedOrder.status === 'shipped' && (
                        <button 
                          onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: 'delivered' })}
                          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 col-span-2"
                        >
                          <PackageCheck size={20} /> Finalizar Pedido
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: 'cancelled' })}
                        className="w-full py-4 border-2 border-rose-100 dark:border-rose-900/30 text-rose-500 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2 col-span-2"
                      >
                        <Trash2 size={20} /> Cancelar Pedido
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersPage;
