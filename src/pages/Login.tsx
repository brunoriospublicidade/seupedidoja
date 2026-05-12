import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Zap,
  ChevronLeft
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { useAuth } from '../App';

const LoginPage = () => {
  const [, setLocation] = useLocation();
  const { restaurantId: activeId, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data: allRestaurants } = trpc.restaurants.listAll.useQuery();

  // Se já estiver logado, leva direto pro admin
  React.useEffect(() => {
    if (activeId) {
      setLocation('/admin');
    }
  }, [activeId, setLocation]);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      return toast.error('Preencha e-mail e senha');
    }

    setIsLoading(true);
    
    // Simulação de login para o MVP
    setTimeout(() => {
      const searchTerms = email.toLowerCase();
      
      const restaurant = allRestaurants?.find(r => {
        const emailInDesc = r.description?.toLowerCase().includes(`email: ${searchTerms}`);
        const phoneMatch = r.phone?.replace(/\D/g, '') === searchTerms.replace(/\D/g, '');
        return emailInDesc || phoneMatch;
      });
      
      if (restaurant) {
        localStorage.setItem('restaurant_id', restaurant.id);
        login(restaurant.id);
        
        toast.success(`Bem-vindo de volta, ${restaurant.name}!`);
        setTimeout(() => setLocation('/admin'), 200);
      } else {
        toast.error('Conta não localizada', {
          description: 'Não encontramos nenhuma loja vinculada a este e-mail ou telefone.'
        });
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Lado Esquerdo - Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          
          <div className="relative z-10">
            <Link href="/" className="inline-block h-12 mb-12">
              <img src="/logo.png" alt="Seu Pedido Já" className="h-full object-contain brightness-0 invert" />
            </Link>

            <h2 className="text-5xl font-black leading-tight mb-8">
              Bom te ver <br /> de novo!
            </h2>

            <div className="space-y-6">
              {[
                'Acesse seu painel de controle',
                'Gerencie seus pedidos em tempo real',
                'Atualize seu cardápio instantaneamente',
                'Acompanhe seu faturamento'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-white/90">
                  <CheckCircle2 className="text-white" size={20} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12">
            <p className="text-sm font-bold text-white/70 italic">"O sistema que transformou meu delivery."</p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary font-bold text-sm mb-6 transition-colors group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao site
            </Link>
            <h3 className="text-3xl font-black text-slate-900">Acesse sua conta</h3>
            <p className="text-slate-500 font-medium mt-2">Bem-vindo de volta ao seu painel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail de Acesso</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={20} /></div>
                <input 
                  autoFocus
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sua Senha</label>
                <button 
                  type="button"
                  onClick={() => toast.info('Funcionalidade de recuperação de senha em breve. Entre em contato com o suporte.')}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={20} /></div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Entrar no Painel'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
            
            <div className="text-center pt-4">
               <p className="text-sm font-bold text-slate-400">
                  Não tem uma conta? <Link href="/cadastro" className="text-primary hover:underline">Faça seu cadastro</Link>
               </p>
            </div>
          </form>

          <div className="mt-12 bg-primary/5 p-6 rounded-3xl border border-primary/10 flex gap-4">
            <Zap size={24} className="text-primary shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Ainda não conhece o Seu Pedido Já? <br />
              <Link href="/cadastro" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline">Comece seu teste grátis de 7 dias</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
