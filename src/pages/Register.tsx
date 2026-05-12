import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Lock, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Zap,
  MapPin,
  Home
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { useAuth } from '../App';

const FOOD_TYPES = [
  { label: 'Hamburgueria', icon: '🍔' },
  { label: 'Pizzaria', icon: '🍕' },
  { label: 'Sushi', icon: '🍣' },
  { label: 'Lanches', icon: '🌭' },
  { label: 'Marmitas', icon: '🍗' },
  { label: 'Cafeteria', icon: '☕' },
  { label: 'Açaí', icon: '🥤' },
  { label: 'Doceria', icon: '🍰' },
  { label: 'Restaurante', icon: '🍛' },
  { label: 'Delivery Local', icon: '🚚' },
];

const RegisterPage = () => {
  const [, setLocation] = useLocation();
  const { restaurantId: activeId, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    foodType: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    email: '',
    phone: '',
    password: ''
  });

    password: ''
  });

  const registerMutation = trpc.restaurants.create.useMutation({
    onSuccess: (data) => {
      console.log('Cadastro realizado com sucesso, ID:', data.id);
      login(data.id);
      toast.success('Conta criada com sucesso! Bem-vindo ao Seu Pedido Já.');
      
      // Pequeno delay para garantir que o estado de auth foi propagado
      setTimeout(() => {
        setLocation('/admin');
      }, 500);
    },
    onError: (err) => {
      if (err.message.includes('Já existe um cadastro')) {
        toast.error('Conta encontrada!', {
          description: 'Já existe um cadastro com este contato. Tente fazer o login.',
          action: {
            label: 'Fazer Login',
            onClick: () => setLocation('/login')
          }
        });
      } else {
        toast.error('Erro ao criar conta: ' + err.message);
      }
      setIsLoading(false);
    }
  });

  // Funções de Suporte
  const formatPhone = (value: string) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length <= 2) {
      formatted = digits.replace(/^(\d{0,2})/, '($1');
    } else if (digits.length <= 7) {
      formatted = digits.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else {
      formatted = digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.length <= 15) {
      setFormData({ ...formData, phone: formatted });
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            cep: cleanCep.replace(/^(\d{5})(\d{3})/, '$1-$2')
          }));
          toast.success('Endereço localizado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const fullAddress = `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city}/${formData.state} - CEP: ${formData.cep}`;
    
    registerMutation.mutate({
      name: formData.restaurantName,
      food_type: formData.foodType,
      email: formData.email,
      phone: formData.phone,
      address: fullAddress
    });
  };

  const { data: allRestaurants } = trpc.restaurants.listAll.useQuery();

  // Se já estiver logado, leva direto pro admin
  React.useEffect(() => {
    if (activeId) {
      console.log('Sessão ativa detectada, redirecionando...', activeId);
      setLocation('/admin');
    }
  }, [activeId, setLocation]);

  const handleNext = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (step === 1 && !formData.restaurantName) return toast.error('Digite o nome do seu negócio');
    if (step === 2 && !formData.foodType) return toast.error('Selecione o tipo do seu negócio');
    if (step === 3 && (!formData.cep || !formData.address || !formData.number)) return toast.error('Preencha os dados obrigatórios do endereço');
    if (step === 4 && (!formData.email || !formData.phone)) return toast.error('Preencha os dados de contato');
    
    if (step < 5) setStep(step + 1);
    else handleRegister();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Lado Esquerdo - Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          
          <div className="relative z-10">
            <Link href="/" className="inline-block h-12 mb-12">
              <img src="/logo.png" alt="Seu Pedido Já" className="h-full object-contain brightness-0 invert" />
            </Link>

            <h2 className="text-5xl font-black leading-tight mb-8">
              Comece a vender <br /> online hoje mesmo.
            </h2>

            <div className="space-y-6">
              {[
                'Teste grátis por 7 dias',
                'Sem taxa por pedido',
                'Cardápio digital profissional',
                'Receba direto no WhatsApp'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-white/90">
                  <CheckCircle2 className="text-white" size={20} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12">
            <div className="flex -space-x-4 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-slate-200" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] font-black">
                +200
              </div>
            </div>
            <p className="text-sm font-bold text-white/70">Junte-se a centenas de pequenos negócios que já modernizaram seu delivery.</p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-white">
          <div className="mb-10">
            {!isLogin && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Passo {step} de 5</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i <= step ? 'w-6 bg-primary' : 'w-3 bg-slate-100'}`} />
                  ))}
                </div>
              </div>
            )}
            <h3 className="text-3xl font-black text-slate-900">
              {step === 1 && 'Qual o nome do seu negócio?'}
              {step === 2 && 'O que você vende?'}
              {step === 3 && 'Onde fica seu restaurante?'}
              {step === 4 && 'Como podemos te contatar?'}
              {step === 5 && 'Crie sua senha de acesso'}
            </h3>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            {isLogin ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail de Acesso</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={20} /></div>
                    <input 
                      autoFocus
                      type="email" 
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sua Senha</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={20} /></div>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome do Restaurante / Lanchonete</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={20} /></div>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Ex: Burger Mania"
                        value={formData.restaurantName}
                        onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                        className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                    {FOOD_TYPES.map((type) => (
                      <button
                        key={type.label}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, foodType: type.label});
                          setTimeout(() => handleNext(), 300);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                          formData.foodType === type.label 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                            : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{type.icon}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.foodType === type.label ? 'text-primary' : 'text-slate-500'}`}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 max-h-[450px] overflow-y-auto no-scrollbar pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">CEP</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            {isCepLoading ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                          </div>
                          <input 
                            type="text" 
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setFormData({...formData, cep: val});
                              if (val.length === 8) handleCepLookup(val);
                            }}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Número</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Home size={18} /></div>
                          <input 
                            type="text" 
                            placeholder="123"
                            value={formData.number}
                            onChange={(e) => setFormData({...formData, number: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Endereço / Logradouro</label>
                      <input 
                        type="text" 
                        placeholder="Rua, Avenida..."
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Bairro</label>
                        <input 
                          type="text" 
                          placeholder="Bairro"
                          value={formData.neighborhood}
                          onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Complemento</label>
                        <input 
                          type="text" 
                          placeholder="Sala, Apto..."
                          value={formData.complement}
                          onChange={(e) => setFormData({...formData, complement: e.target.value})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Cidade</label>
                        <input 
                          type="text" 
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado (UF)</label>
                        <input 
                          type="text" 
                          placeholder="SP"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                          maxLength={2}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail Profissional</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={20} /></div>
                        <input 
                          autoFocus
                          type="email" 
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">WhatsApp</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Smartphone size={20} /></div>
                        <input 
                          type="tel" 
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Senha Segura</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={20} /></div>
                      <input 
                        autoFocus
                        type="password" 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                      />
                    </div>
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-3 mt-4">
                      <Zap size={20} className="text-primary shrink-0" />
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Ao criar sua conta, você aceita nossos termos de uso e inicia automaticamente seu período de 7 dias grátis.
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            <button 
              type="submit" 
              disabled={isLoading || (step === 2 && !formData.foodType) || isCepLoading}
              className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : (step === 5 ? 'Finalizar Cadastro' : 'Continuar')}
              {!isLoading && <ArrowRight size={20} />}
            </button>
            
            <div className="text-center pt-4">
               <p className="text-sm font-bold text-slate-400">
                  Já tem uma conta? <Link href="/login" className="text-primary hover:underline">Acesse o painel</Link>
               </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
