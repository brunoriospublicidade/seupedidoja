import React from 'react';
import { useRoute } from 'wouter';
import { trpc } from '../lib/trpc';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  PackageCheck, 
  MapPin, 
  ShoppingBag,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const OrderTracking = () => {
  const [, params] = useRoute('/tracking/:id');
  const orderId = params?.id;

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId || '' },
    { 
      enabled: !!orderId,
      refetchInterval: 10000 // Atualiza a cada 10 segundos
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-4">
        <XCircle size={64} className="text-rose-500" />
        <h1 className="text-2xl font-black text-slate-800">Pedido não encontrado</h1>
        <p className="text-slate-500">Verifique se o link está correto ou tente novamente mais tarde.</p>
        <Link href="/" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold">Voltar ao Início</Link>
      </div>
    );
  }

  const steps = [
    { status: 'pending', label: 'Pendente', icon: Clock, description: 'Aguardando confirmação' },
    { status: 'received', label: 'Recebido', icon: CheckCircle2, description: 'Confirmado pelo restaurante' },
    { status: 'preparing', label: 'Em Preparo', icon: ChefHat, description: 'Sua comida está sendo preparada' },
    { status: 'shipped', label: 'Em Entrega', icon: Bike, description: 'O entregador está a caminho' },
    { status: 'delivered', label: 'Entregue', icon: PackageCheck, description: 'Pedido finalizado. Bom apetite!' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-6 py-6 flex items-center gap-4">
          <Link href={`/menu/${order.restaurant?.slug}`} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Status do Pedido</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-8">
        {/* Tracker Section (Domino's Style) */}
        <section className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100 overflow-hidden relative">
          {isCancelled ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Pedido Cancelado</h2>
              <p className="text-slate-500">Infelizmente seu pedido foi cancelado pelo restaurante.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Progress Bar Visual */}
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400"
                />
              </div>

              {/* Status Steps */}
              <div className="space-y-8">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className={`flex items-start gap-6 transition-all ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        isCurrent ? 'bg-primary text-white scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className={`font-black uppercase tracking-widest text-xs ${isCurrent ? 'text-primary' : 'text-slate-800'}`}>
                          {step.label}
                        </h3>
                        <p className="text-sm font-medium text-slate-500">{step.description}</p>
                      </div>
                      {isCurrent && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-ping mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Resumo da Encomenda</h3>
            <ShoppingBag size={18} className="text-slate-400" />
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {(order.items as any[]).map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.quantity}x {item.name}</p>
                    {item.choices && item.choices.map((c: any, cIdx: number) => (
                      <p key={cIdx} className="text-xs text-slate-400">• {c.itemName}</p>
                    ))}
                  </div>
                  <p className="font-black text-slate-800">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <span className="font-black text-slate-800 uppercase tracking-widest text-xs">Total Pago</span>
              <span className="text-2xl font-black text-primary">R$ {Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Delivery Details */}
        <section className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
            <MapPin size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Endereço de Entrega</h3>
            <p className="text-sm font-bold text-slate-600 leading-relaxed">{order.address || 'Retirada no Local'}</p>
            {order.neighborhood && <p className="text-xs font-medium text-slate-400">{order.neighborhood}</p>}
          </div>
        </section>

        {/* Help / WhatsApp */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Precisa de ajuda com o pedido?</p>
          <a 
            href={`https://wa.me/55${order.restaurant?.phone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
          >
            Falar com o Restaurante
          </a>
        </div>
      </main>
    </div>
  );
};

const XCircle = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default OrderTracking;
