import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Users, 
  Zap, 
  CreditCard, 
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

const MarketingPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  
  const [showBuyModal, setShowBuyModal] = useState(false);
  
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: restaurant } = trpc.restaurants.get.useQuery();

  const CREDIT_PACKAGES = [
    { id: 'pkg_1', name: 'Bronze', credits: 100, price: 15.00, popular: false },
    { id: 'pkg_2', name: 'Prata', credits: 500, price: 60.00, popular: true },
    { id: 'pkg_3', name: 'Ouro', credits: 1000, price: 100.00, popular: false },
  ];

  const TEMPLATES = [
    { id: '1', name: 'Boas-vindas', content: 'Olá {{name}}! Seja bem-vindo ao {{restaurant}}. Temos um cupom de 10% para você: BEMVINDO10' },
    { id: '2', name: 'Saudades', content: 'Oi {{name}}, faz tempo que não te vemos! Que tal um lanche hoje? Peça agora em: {{link}}' },
    { id: '3', name: 'Promoção Relâmpago', content: 'SÓ HOJE! {{name}}, aproveite nossa promoção de Compre 1 Leve 2. Válido até as 22h!' },
  ];

  const credits = restaurant?.messageCredits || 30;
  const usedThisMonth = restaurant?.messagesSentThisMonth || 0;

  const sendMutation = trpc.marketing.sendWhatsApp.useMutation();

  const handleSend = async (customer: any) => {
    if (!selectedTemplate) return toast.error('Selecione um template primeiro');
    
    const message = TEMPLATES.find(t => t.id === selectedTemplate)?.content
      .replace('{{name}}', customer.name)
      .replace('{{restaurant}}', restaurant?.name || 'nossa loja')
      .replace('{{link}}', window.location.origin + '/menu/' + restaurant?.slug);

    toast.promise(
      sendMutation.mutateAsync({
        phone: customer.phone,
        message: message || '',
        restaurantId: restaurant?.id || ''
      }),
      {
        loading: 'Enviando WhatsApp...',
        success: 'Mensagem enviada via API! 🚀',
        error: (err: any) => 'Falha no envio: ' + err.message
      }
    );
  };

  const handleBulkSend = async () => {
    if (!selectedTemplate) return toast.error('Selecione um template primeiro');
    if (!customers?.length) return toast.error('Nenhum cliente selecionado');
    
    toast.promise(async () => {
      for (const customer of (customers as any[])) {
        const message = TEMPLATES.find(t => t.id === selectedTemplate)?.content
          .replace('{{name}}', customer.name)
          .replace('{{restaurant}}', restaurant?.name || 'nossa loja')
          .replace('{{link}}', window.location.origin + '/menu/' + restaurant?.slug);

        try {
          await sendMutation.mutateAsync({
            phone: customer.phone,
            message: message || '',
            restaurantId: restaurant?.id || ''
          });
          // Pequeno delay entre mensagens para evitar bloqueio
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          console.error('Erro no disparo individual:', e);
          // Continua para o próximo mesmo se um falhar
        }
      }
    }, {
      loading: 'Iniciando disparos em massa... Isso pode levar alguns minutos.',
      success: 'Campanha finalizada com sucesso! 🏁',
      error: 'Ocorreu um erro durante a campanha.'
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             Mala Direta <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">CRM Marketing</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Crie campanhas de WhatsApp e fidelize seus clientes.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">{credits - usedThisMonth} / {credits}</div>
              <div className="text-[10px] font-black uppercase text-slate-400">Créditos Disponíveis</div>
            </div>
            <button 
              onClick={() => setShowBuyModal(true)}
              className="ml-2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Compra de Créditos */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 md:p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Recarregar Créditos ⚡</h3>
                    <p className="text-slate-500 text-sm mt-2">Escolha um pacote e continue seus disparos de marketing.</p>
                  </div>
                  <button 
                    onClick={() => setShowBuyModal(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className={`relative p-6 rounded-[32px] border-2 flex flex-col items-center text-center transition-all ${
                        pkg.popular 
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' 
                        : 'border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                          Mais Popular
                        </div>
                      )}
                      <div className="text-sm font-bold text-slate-400 mb-1">{pkg.name}</div>
                      <div className="text-3xl font-black text-slate-800 dark:text-white mb-2">{pkg.credits}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Mensagens</div>
                      <div className="text-xl font-bold text-emerald-500 mb-6">
                        R$ {(Number(pkg.price) || 0).toFixed(2).replace('.', ',')}
                      </div>
                      <button className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all">
                        Comprar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-800 flex gap-4 items-start">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    Os créditos comprados não expiram e podem ser usados a qualquer momento. O pagamento é processado de forma segura via Stripe.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Meus Templates
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">+ Criar Novo</button>
          </div>

          <div className="space-y-3">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full p-5 rounded-2xl border text-left transition-all ${
                  selectedTemplate === template.id
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50'
                }`}
              >
                <div className="font-bold mb-1">{template.name}</div>
                <div className={`text-[10px] line-clamp-2 ${selectedTemplate === template.id ? 'text-white/80' : 'text-slate-400'}`}>
                  {template.content}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Disparo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar clientes..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isBulkMode ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Modo em Massa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Pedidos</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {customers?.map((customer: any) => (
                    <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-800 dark:text-white">{customer.name}</div>
                        <div className="text-[10px] text-slate-400">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600">{customer.total_orders || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleSend(customer)}
                          disabled={!selectedTemplate}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-30"
                        >
                          <Send size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isBulkMode && (
              <div className="p-6 bg-primary/5 border-t border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Users size={18} />
                  {customers?.length || 0} clientes selecionados
                </div>
                <button 
                  onClick={handleBulkSend}
                  disabled={!selectedTemplate || sendMutation.isLoading}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {sendMutation.isLoading && <Loader2 className="animate-spin" size={18} />}
                  Iniciar Disparo em Massa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;
