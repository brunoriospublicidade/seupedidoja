import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  DollarSign, 
  MessageSquare, 
  ShieldCheck, 
  Save,
  Info,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';

const AdminSettingsPage = () => {
  const [freeCredits, setFreeCredits] = useState('30');
  const [msgPrice, setMsgPrice] = useState('0.15');
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionKey, setEvolutionKey] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  
  const { data: config, isLoading } = trpc.settings.get.useQuery(undefined, {
    onSuccess: (data: any) => {
      setFreeCredits(data.free_credits?.toString() || '30');
      setMsgPrice(data.price_per_message?.toString() || '0.15');
      setEvolutionUrl(data.evolution_url || '');
      setEvolutionKey(data.evolution_key || '');
      setEvolutionInstance(data.evolution_instance || '');
    }
  });

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success('Configurações salvas!', {
        description: 'As alterações entrarão em vigor para todos os novos disparos.'
      });
    },
    onError: (err) => {
      toast.error('Erro ao salvar: ' + err.message);
    }
  });
  
  const handleSave = () => {
    updateMutation.mutate({
      free_credits: parseInt(freeCredits),
      price_per_message: parseFloat(msgPrice.replace(',', '.')),
      evolution_url: evolutionUrl,
      evolution_key: evolutionKey,
      evolution_instance: evolutionInstance
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Settings className="text-primary" size={32} /> Configurações da Plataforma
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie os parâmetros globais e custos do sistema.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custos de Marketing */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <MessageSquare className="text-primary" size={20} /> Mala Direta (WhatsApp)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mensagens Gratuitas / Mês</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="number" 
                  value={freeCredits}
                  onChange={(e) => setFreeCredits(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Quantidade de mensagens que cada loja ganha por mês.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Valor por Mensagem Adicional</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                <input 
                  type="text" 
                  value={msgPrice}
                  onChange={(e) => setMsgPrice(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-emerald-500 font-bold">Valor cobrado por disparo extra (em Reais).</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
            <Info className="text-blue-500 shrink-0" size={18} />
            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
              Estes valores são usados para gerar as cobranças automáticas no Stripe quando o lojista solicita uma recarga de saldo.
            </p>
          </div>
        </div>

        {/* Configurações da Evolution API */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Zap className="text-primary" size={20} /> Conexão Evolution API
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">URL da API</label>
              <input 
                type="text" 
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                placeholder="https://sua-api.com"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Global API Key</label>
              <input 
                type="password" 
                value={evolutionKey}
                onChange={(e) => setEvolutionKey(e.target.value)}
                placeholder="Sua chave secreta"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nome da Instância</label>
              <input 
                type="text" 
                value={evolutionInstance}
                onChange={(e) => setEvolutionInstance(e.target.value)}
                placeholder="Ex: ServeUp_Bot"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
            <p className="text-[10px] text-emerald-700 dark:text-blue-300 font-medium leading-relaxed">
              Estes dados permitem que o sistema envie mensagens automáticas usando o seu próprio número de WhatsApp via Evolution API.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                updateMutation.mutate({
                  free_credits: parseInt(freeCredits),
                  price_per_message: parseFloat(msgPrice.replace(',', '.')),
                  evolution_url: evolutionUrl,
                  evolution_key: evolutionKey,
                  evolution_instance: evolutionInstance
                });
              }}
              disabled={updateMutation.isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {updateMutation.isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              Salvar Conexão WhatsApp
            </button>
          </div>
        </div>

        {/* Outras Configurações */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="text-primary" size={20} /> Segurança e Sistema
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Novos Cadastros Habilitados</span>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl opacity-50">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Modo de Manutenção</span>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={updateMutation.isLoading}
          className="flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {updateMutation.isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <Save size={20} />
          )}
          {updateMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
