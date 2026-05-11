import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Send, Phone, MessageSquare, Loader2, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const WhatsAppTestPage = () => {
  const { data: settings, isLoading: loadingSettings } = trpc.restaurants.getEvolutionSettings.useQuery();
  const [testData, setTestData] = useState({ number: '', text: 'Olá! Este é um teste de conexão do Seu Pedido Já. 🍔' });
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testMutation = trpc.restaurants.testWhatsApp.useMutation({
    onSuccess: (data) => {
      setDebugInfo(data);
      if (data.success) {
        toast.success('Comando enviado! Verifique o WhatsApp.');
      } else {
        toast.error('A API recusou o envio. Veja os detalhes abaixo.');
      }
    },
    onError: (err) => {
      setDebugInfo({ error: err.message });
      toast.error('Erro de conexão com o servidor.');
    }
  });

  const handleTest = () => {
    if (!testData.number) return toast.error('Digite um número para teste');
    testMutation.mutate(testData);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <MessageSquare className="text-primary" size={32} /> Debug WhatsApp
          </h2>
          <p className="text-slate-500 font-medium">Ferramenta para testar a comunicação direta com a Evolution API.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
           <div className="text-[10px] font-black uppercase text-slate-400">Status no Servidor</div>
           {loadingSettings ? (
             <Loader2 className="animate-spin text-primary" size={16} />
           ) : (
             <div className="space-y-1">
               <div className="text-[9px] font-mono text-slate-400 mb-1">ID: {settings?.ctxId}</div>
               <div className="flex items-center gap-2 text-[10px] font-bold">
                 <span className={settings?.hasUrl ? 'text-emerald-500' : 'text-red-500'}>● URL: {settings?.hasUrl ? 'OK' : 'Faltando'}</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold">
                 <span className={settings?.hasKey ? 'text-emerald-500' : 'text-red-500'}>● Key: {settings?.hasKey ? 'OK' : 'Faltando'}</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold">
                 <span className={settings?.hasInstance ? 'text-emerald-500' : 'text-red-500'}>● Instância: {settings?.hasInstance ? 'OK' : 'Faltando'}</span>
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Phone size={12} className="text-primary" /> Número de Destino
            </label>
            <input 
              type="text" 
              placeholder="(00) 00000-0000"
              value={testData.number}
              onChange={(e) => setTestData({...testData, number: e.target.value})}
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MessageSquare size={12} className="text-primary" /> Mensagem
            </label>
            <textarea 
              rows={4}
              value={testData.text}
              onChange={(e) => setTestData({...testData, text: e.target.value})}
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/20 font-bold resize-none"
            />
          </div>

          <button 
            onClick={handleTest}
            disabled={testMutation.isLoading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {testMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Enviar Teste</>}
          </button>

          {settings?.rawData && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[8px] font-mono text-slate-400 overflow-auto max-h-20 break-all bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                DB_RAW: {settings.rawData}
              </div>
            </div>
          )}
        </div>

        {/* Console / Debug */}
        <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold flex items-center gap-2"><Terminal size={18} className="text-emerald-500" /> Resposta da API</h3>
            {debugInfo && (
              <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase ${debugInfo.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                {debugInfo.success ? 'Sucesso' : 'Falha'}
              </span>
            )}
          </div>

          <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 overflow-auto whitespace-pre-wrap">
            {debugInfo ? (
              JSON.stringify(debugInfo, null, 2)
            ) : (
              <span className="text-slate-600 italic">// Aguardando envio de teste...</span>
            )}
          </div>

          {debugInfo?.success && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500">
              <CheckCircle2 size={20} />
              <p className="text-xs font-bold">A API aceitou a mensagem! Se não chegou no celular, verifique se a instância está conectada no painel da Evolution.</p>
            </div>
          )}

          {debugInfo?.success === false && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="text-xs font-bold">A API retornou um erro. Verifique se a URL e a API Key em Configurações estão corretas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTestPage;
