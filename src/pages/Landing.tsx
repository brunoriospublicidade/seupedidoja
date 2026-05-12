import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  MessageCircle, 
  QrCode, 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  ChevronRight,
  Menu as MenuIcon,
  X,
  PlusCircle,
  ShoppingBag,
  Star,
  Plus
} from 'lucide-react';
import { Link } from 'wouter';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const navItems = [
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Benefícios', href: '#beneficios' },
    { label: 'Preço', href: '#preco' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/30">
      {/* Header / Nav */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="h-10">
              <img src="/logo.png" alt="Seu Pedido Já" className="h-full object-contain" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest">
                {item.label}
              </a>
            ))}
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Começar Grátis
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600">
            {isMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {navItems.map((item) => (
                  <a key={item.label} href={item.href} onClick={() => setIsMenuOpen(false)} className="text-lg font-black text-slate-800">
                    {item.label}
                  </a>
                ))}
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-lg font-black text-slate-800 uppercase tracking-widest">
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setIsMenuOpen(false)} className="bg-primary text-white py-4 rounded-2xl text-center font-black uppercase tracking-widest">
                  Começar Grátis
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
              <Zap size={14} /> 7 Dias de Teste Grátis
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Seu cardápio <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">online profissional</span> <br />
              em poucos minutos.
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
              Transforme seu restaurante, lanchonete, pizzaria ou delivery em um sistema de pedidos online simples, bonito e acessível.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/cadastro" className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                Quero Testar Grátis <ChevronRight />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                Entrar
              </Link>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
              <CheckCircle2 className="text-emerald-500" /> Sem cartão de crédito
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              {[
                { label: 'Cardápio Digital', icon: Smartphone },
                { label: 'QR Code', icon: QrCode },
                { label: 'WhatsApp', icon: MessageCircle },
                { label: 'Gestão', icon: LayoutDashboard },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-2 items-center text-center">
                  <item.icon className="text-primary" size={20} />
                  <span className="text-[10px] font-black uppercase text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative bg-slate-900 p-4 rounded-[40px] shadow-2xl border-8 border-slate-800 max-w-[320px] mx-auto transform hover:rotate-2 transition-transform duration-500">
              <div className="bg-white rounded-[32px] overflow-hidden">
                {/* Mockup do App */}
                <div className="h-[500px] bg-slate-50 relative overflow-hidden">
                   <div className="p-4 bg-primary text-white">
                      <div className="flex justify-between items-center mb-4">
                         <span className="font-black text-xs uppercase">Burger Mania</span>
                         <MenuIcon size={18} />
                      </div>
                      <div className="h-24 bg-white/20 rounded-2xl flex items-center justify-center italic text-xs">Banner do Restaurante</div>
                   </div>
                   <div className="p-4 space-y-4">
                      <div className="h-4 w-24 bg-slate-200 rounded-full" />
                      <div className="grid grid-cols-2 gap-4">
                         <div className="h-32 bg-white rounded-2xl shadow-sm p-2 space-y-2">
                            <div className="h-16 bg-slate-100 rounded-xl" />
                            <div className="h-2 w-12 bg-slate-200 rounded-full" />
                            <div className="h-2 w-16 bg-primary/20 rounded-full" />
                         </div>
                         <div className="h-32 bg-white rounded-2xl shadow-sm p-2 space-y-2">
                            <div className="h-16 bg-slate-100 rounded-xl" />
                            <div className="h-2 w-12 bg-slate-200 rounded-full" />
                            <div className="h-2 w-16 bg-primary/20 rounded-full" />
                         </div>
                      </div>
                   </div>
                   <div className="absolute bottom-0 w-full p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                        <span className="font-black text-primary">R$ 49,90</span>
                      </div>
                      <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase">Finalizar Pedido</div>
                   </div>
                </div>
              </div>
            </div>
            {/* Flutuantes */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -right-4 top-1/4 bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><MessageCircle size={20}/></div>
               <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Novo Pedido</span>
                  <span className="text-xs font-black">Burger + Batata</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Simples para você. Fácil para o cliente.</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Transformação Digital sem Complicação</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Cadastre seu cardápio',
                desc: 'Adicione categorias, produtos, fotos, preços e opcionais como ponto da carne, acompanhamentos e bebidas.',
                icon: PlusCircle,
                color: 'bg-blue-500'
              },
              {
                step: '02',
                title: 'Compartilhe seu QR Code',
                desc: 'Seu restaurante recebe um QR Code exclusivo para as mesas, balcão, embalagens e redes sociais.',
                icon: QrCode,
                color: 'bg-purple-500'
              },
              {
                step: '03',
                title: 'Receba no WhatsApp',
                desc: 'O cliente monta o pedido e você recebe tudo organizado no seu WhatsApp com endereço e itens.',
                icon: MessageCircle,
                color: 'bg-emerald-500'
              }
            ].map((item, idx) => (
              <motion.div 
                {...fadeIn}
                key={idx} 
                className="relative bg-white p-10 rounded-[40px] shadow-sm hover:shadow-xl transition-shadow group"
              >
                <div className="absolute top-8 right-8 text-5xl font-black text-slate-100 group-hover:text-primary/5 transition-colors">{item.step}</div>
                <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/5`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-4">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Para */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeIn} className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
               Feito para <span className="text-primary italic">pequenos</span> negócios
            </h2>
            <p className="text-lg text-slate-500 font-medium">
               O Seu Pedido Já foi criado para quem quer vender mais sem depender de aplicativos caros.
            </p>
            <div className="grid grid-cols-2 gap-5">
              {[
                '🍔 Hamburguerias', '🍕 Pizzarias', '🍣 Sushi', '🌭 Lanches',
                '🍗 Marmitas', '☕ Cafeterias', '🥤 Açaí', '🍰 Docerias',
                '🍛 Restaurantes', '🚚 Delivery local'
              ].map((cat) => (
                <div key={cat} className="flex items-center gap-3 p-5 bg-white border border-slate-100 rounded-[24px] font-black text-slate-800 text-base shadow-sm hover:shadow-xl hover:border-primary/20 hover:scale-105 transition-all cursor-default group">
                   <span className="group-hover:scale-125 transition-transform duration-300">{cat.split(' ')[0]}</span>
                   <span>{cat.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/30 blur-[100px] opacity-20" />
             <div className="grid grid-cols-2 gap-6 relative">
                <div className="space-y-6 pt-12">
                   <div className="h-64 bg-slate-200 rounded-[40px] animate-pulse" />
                   <div className="h-48 bg-slate-100 rounded-[40px] animate-pulse" />
                </div>
                <div className="space-y-6">
                   <div className="h-48 bg-slate-100 rounded-[40px] animate-pulse" />
                   <div className="h-64 bg-slate-200 rounded-[40px] animate-pulse" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-32 px-6 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Tudo que você precisa para vender online</h2>
            <p className="text-primary font-black uppercase tracking-[0.2em] text-xs">Recursos Profissionais de Elite</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {[
               { title: 'Cardápio Digital Moderno', desc: 'Visual bonito e profissional para seus clientes comprarem com facilidade.', icon: Smartphone },
               { title: 'Pedidos no WhatsApp', desc: 'Sem precisar instalar sistemas complicados. Tudo direto no seu Zap.', icon: MessageCircle },
               { title: 'Cadastro de Opcionais', desc: 'Permita personalizações: adicionais, acompanhamentos, tamanhos e mais.', icon: PlusCircle },
               { title: 'Painel Admin Completo', desc: 'Controle pedidos, produtos, categorias, clientes e cupons.', icon: LayoutDashboard },
               { title: 'Relatórios e Gráficos', desc: 'Acompanhe o crescimento do seu negócio com dados reais.', icon: TrendingUp },
               { title: 'Importação por Planilha', desc: 'Cadastre vários produtos rapidamente usando Excel.', icon: PieChart },
             ].map((feat, idx) => (
               <motion.div 
                {...fadeIn}
                key={idx}
                className="group p-8 bg-white/5 rounded-[40px] border border-white/10 hover:bg-white/10 transition-all"
               >
                 <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                   <feat.icon size={24} />
                 </div>
                 <h4 className="text-xl font-black mb-3">{feat.title}</h4>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Apenas <span className="text-primary">R$ 9,90</span>/mês</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs italic">Sem taxas. Sem comissão. Simples assim.</p>
          </div>

          <div className="bg-white p-12 rounded-[50px] border-2 border-primary shadow-2xl shadow-primary/10 space-y-10 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                   {['Cardápio digital completo', 'Pedidos pelo celular', 'QR Code personalizado', 'Recebimento no WhatsApp'].map(item => (
                     <div key={item} className="flex items-center gap-3 font-bold text-slate-700">
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                           <CheckCircle2 size={14} />
                        </div>
                        {item}
                     </div>
                   ))}
                </div>
                <div className="space-y-4">
                   {['Cadastro ilimitado', 'Opcionais e adicionais', 'Relatórios e gestão', 'Teste grátis por 7 dias'].map(item => (
                     <div key={item} className="flex items-center gap-3 font-bold text-slate-700">
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                           <CheckCircle2 size={14} />
                        </div>
                        {item}
                     </div>
                   ))}
                </div>
             </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
                <Link href="/cadastro" className="w-full sm:w-auto px-16 py-6 bg-primary text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  Quero Testar Grátis
                </Link>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cancele quando quiser • 7 dias grátis</span>
              </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Modernizando as vendas pelo Brasil</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {[
               { quote: "Antes eu anotava tudo no papel. Agora os clientes fazem o pedido direto pelo celular e chega organizado no WhatsApp. Economiza muito tempo.", author: "Carlos", place: "Hamburgueria" },
               { quote: "O QR Code nas mesas facilitou demais o atendimento. O cliente não precisa ficar esperando eu ir até a mesa para entregar o cardápio.", author: "Mariana", place: "Cafeteria" }
             ].map((dep, idx) => (
               <div key={idx} className="bg-white p-12 rounded-[40px] shadow-sm space-y-6">
                  <div className="flex gap-1 text-primary">
                     {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-lg font-medium italic text-slate-700 leading-relaxed">“{dep.quote}”</p>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-200 rounded-full" />
                     <div>
                        <div className="font-black text-slate-900">{dep.author}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dep.place}</div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Preciso instalar aplicativo?', a: 'Não. O sistema funciona diretamente pelo navegador do celular, o que facilita para você e para o seu cliente.' },
              { q: 'Os pedidos chegam onde?', a: 'Você recebe os pedidos automaticamente e organizados no seu WhatsApp cadastrado.' },
              { q: 'Posso cadastrar adicionais e opcionais?', a: 'Sim. Você tem liberdade total para criar acompanhamentos, adicionais, tamanhos, ponto da carne e muito mais.' },
              { q: 'Tem taxa por pedido?', a: 'Não. Você paga apenas a mensalidade fixa. 100% do lucro das vendas é seu.' },
            ].map((item, idx) => (
              <details key={idx} className="group bg-slate-50 rounded-3xl p-6 cursor-pointer outline-none">
                 <summary className="list-none flex items-center justify-between font-black text-slate-800 text-lg group-open:text-primary transition-colors">
                    {item.q}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center group-open:border-primary group-open:rotate-45 transition-all">
                       <Plus size={18} />
                    </div>
                 </summary>
                 <div className="pt-4 text-slate-500 leading-relaxed font-medium">
                    {item.a}
                 </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-6">
              <Link href="/" className="h-12 inline-block">
                <img src="/logo.png" alt="Seu Pedido Já" className="h-full object-contain brightness-0 invert" />
              </Link>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Seu cardápio digital simples, profissional e acessível. Criado para impulsionar pequenos negócios locais.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><Smartphone size={20}/></div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><MessageCircle size={20}/></div>
              </div>
            </div>
            
            <div className="space-y-6">
               <h5 className="font-black text-sm uppercase tracking-[0.2em] text-primary">Navegação</h5>
               <div className="flex flex-col gap-4">
                  {navItems.map(item => <a key={item.label} href={item.href} className="text-slate-400 font-bold hover:text-white transition-colors">{item.label}</a>)}
               </div>
            </div>

            <div className="space-y-6">
               <h5 className="font-black text-sm uppercase tracking-[0.2em] text-primary">Comece Agora</h5>
               <Link href="/cadastro" className="inline-block px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Testar Grátis
               </Link>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             <span>© 2024 SEU PEDIDO JÁ. TODOS OS DIREITOS RESERVADOS.</span>
             <div className="flex gap-8">
                <span className="cursor-pointer hover:text-white">Termos de Uso</span>
                <span className="cursor-pointer hover:text-white">Privacidade</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default LandingPage;
