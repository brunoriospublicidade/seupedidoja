import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  DollarSign, 
  UtensilsCrossed, 
  ListTree, 
  PlusCircle, 
  QrCode as QrIcon, 
  ExternalLink,
  Package,
  Clock,
  ChevronRight,
  Download,
  Loader2
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import QRCode from 'qrcode';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-black/5 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <div className="text-3xl font-black mb-1 text-slate-800 dark:text-white group-hover:text-primary transition-colors">{value}</div>
    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
  </div>
);

const DashboardPage = () => {
  const [, setLocation] = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: restaurant } = trpc.restaurants.get.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: optionals } = trpc.optionals.listGroups.useQuery();

  const menuUrl = restaurant?.slug ? `${window.location.origin}/menu/${restaurant.slug}` : '#';

  useEffect(() => {
    if (restaurant?.slug) {
      QRCode.toDataURL(menuUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [restaurant, menuUrl]);

  const handleOpenMenu = () => {
    if (restaurant?.slug) {
      window.open(menuUrl, '_blank');
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;
    setIsGenerating(true);
    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qrcode-pedidoja-${restaurant?.slug || 'menu'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR Code baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Olá, {restaurant?.name || 'Restaurante'}! 👋</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhe o crescimento e os números do seu cardápio digital.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20">Visão Geral</button>
          <button 
            onClick={() => setLocation('/admin/relatorios')}
            className="px-5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl font-bold text-xs transition-all"
          >
            Relatórios
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pedidos (Hoje)" value="0" icon={LineChart} color="bg-blue-500" trend="Novo" />
        <StatCard title="Faturamento" value="R$ 0,00" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Produtos Ativos" value={products?.length || 0} icon={UtensilsCrossed} color="bg-orange-500" />
        <StatCard title="Categorias" value={categories?.length || 0} icon={ListTree} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card de QR Code Real */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="p-4 bg-white rounded-[40px] border-4 border-slate-50 shadow-inner group-hover:border-primary transition-all duration-500 overflow-hidden aspect-square w-[220px] flex items-center justify-center">
              {qrCodeUrl ? (
                <motion.img 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={qrCodeUrl} 
                  alt="Menu QR Code" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Loader2 className="animate-spin" size={40} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Gerando...</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 p-3 bg-primary text-white rounded-2xl shadow-xl border-4 border-white dark:border-slate-900 group-hover:scale-110 transition-transform">
              <QrIcon size={20} />
            </div>
          </div>
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">QR Code Gerado! 🚀</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Este código leva direto ao seu cardápio. 
                Imprima e cole nas mesas para que seus clientes façam pedidos instantâneos.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer" onClick={() => {
              navigator.clipboard.writeText(menuUrl);
              toast.success('Link copiado!');
            }}>
              <span className="text-xs font-bold text-primary truncate max-w-[200px]">{menuUrl}</span>
              <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Copiar</button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleOpenMenu}
                className="flex-1 py-4 bg-primary text-white rounded-[20px] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                <ExternalLink size={20} />
                Testar Link
              </button>
              <button 
                onClick={handleDownloadQR}
                disabled={!qrCodeUrl || isGenerating}
                className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                Download QR
              </button>
            </div>
          </div>
        </div>

        {/* Card de Opcionais e Atalhos */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white">Complementos</h3>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <PlusCircle size={20} />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold dark:text-white">Grupos Criados</span>
                <span className="text-2xl font-black text-primary">{optionals?.length || 0}</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Opcionais configurados</p>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Acesso Rápido</p>
              <Link href="/admin/relatorios" className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-slate-400 group-hover:text-primary" />
                  <span className="text-sm font-bold dark:text-white">Relatórios</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
              <Link href="/admin/configuracoes" className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-slate-400 group-hover:text-primary" />
                  <span className="text-sm font-bold dark:text-white">Configurações</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
