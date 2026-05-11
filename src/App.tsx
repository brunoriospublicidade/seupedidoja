import React, { createContext, useContext, useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation, Redirect } from 'wouter';
import { 
  ShoppingBag,
  LayoutDashboard, 
  UtensilsCrossed, 
  Settings, 
  ListTree, 
  PlusCircle, 
  Sun, 
  Moon,
  Menu as MenuIcon,
  ChevronLeft,
  PieChart,
  Users,
  CreditCard,
  Layers,
  Ticket,
  ArrowLeft,
  LogOut,
  Building2,
  TrendingUp,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { trpc } from './lib/trpc';

// Pages
import LandingPage from './pages/Landing';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import CategoriesPage from './pages/Categories';
import OptionalsPage from './pages/Optionals';
import SettingsPage from './pages/Settings';
import MenuPage from './pages/Menu';
import PublicMenu from './pages/PublicMenu';
import ReportsPage from './pages/Reports';
import UsersPage from './pages/Users';
import PaymentsPage from './pages/Payments';
import PlansPage from './pages/Plans';
import CouponsPage from './pages/Coupons';
import CustomersPage from './pages/Customers';
import MarketingPage from './pages/Marketing';
import AdminUsersPage from './pages/AdminUsers';
import AdminPaymentsPage from './pages/AdminPayments';
import AdminReportsPage from './pages/AdminReports';
import AdminSettingsPage from './pages/AdminSettings';
import AdminAnalyticsPage from './pages/AdminAnalytics';
import OrdersPage from './pages/Orders';
import WhatsAppTestPage from './pages/WhatsAppTest';

// Auth Context
const AuthContext = createContext({
  restaurantId: '',
  role: 'user',
  login: (id: string) => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Sidebar Context
const SidebarContext = createContext({
  isOpen: true,
  toggle: () => {},
});

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

const useSidebar = () => useContext(SidebarContext);

const Sidebar = () => {
  const { isOpen, toggle } = useSidebar();
  const { logout, restaurantId, role } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useContext();
  
  const { data: restaurant } = trpc.restaurants.get.useQuery(
    { id: restaurantId },
    { enabled: !!restaurantId }
  );
  
  const updateMutation = trpc.restaurants.update.useMutation({
    onSuccess: () => utils.restaurants.get.invalidate()
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (restaurant?.themePreference) {
      const dark = restaurant.themePreference === 'dark';
      setIsDark(dark);
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [restaurant]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    updateMutation.mutate({ theme_preference: newDark ? 'dark' : 'light' });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag, path: '/admin/pedidos', isHighlighted: true },
    { id: 'products', label: 'Produtos', icon: UtensilsCrossed, path: '/admin/produtos' },
    { id: 'categories', label: 'Categorias', icon: ListTree, path: '/admin/categorias' },
    { id: 'optionals', label: 'Complementos', icon: PlusCircle, path: '/admin/complementos' },
    { id: 'coupons', label: 'Cupons', icon: Ticket, path: '/admin/cupons' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/admin/clientes' },
    { id: 'marketing', label: 'Mala Direta', icon: MessageSquare, path: '/admin/mala-direta' },
    { id: 'reports', label: 'Relatórios', icon: PieChart, path: '/admin/relatorios' },
    { id: 'payments', label: 'Minha Assinatura', icon: CreditCard, path: '/admin/pagamentos' },
  ];

  const adminItems = [
    { id: 'admin-users', label: 'Usuários/Lojas', icon: Building2, path: '/admin/gerenciar-lojas' },
    { id: 'admin-analytics', label: 'Análise de Performance', icon: TrendingUp, path: '/admin/analise-performance' },
    { id: 'admin-payments', label: 'Pagamentos Plataforma', icon: CreditCard, path: '/admin/pagamentos-plataforma' },
    { id: 'admin-reports', label: 'Relatórios Plataforma', icon: TrendingUp, path: '/admin/relatorios-plataforma' },
    { id: 'whatsapp-test', label: 'Teste WhatsApp', icon: MessageCircle, path: '/admin/teste-whatsapp' },
    { id: 'admin-settings', label: 'Configurações', icon: Settings, path: '/admin/configuracoes-plataforma' },
  ];

  const menuGroups = [
    {
      title: 'Gestão da Loja',
      items: menuItems.map(i => ({ href: i.path, icon: i.icon, label: i.label, isHighlighted: (i as any).isHighlighted }))
    },
    ...(role === 'admin' ? [{
      title: 'Administração do Sistema',
      items: adminItems.map(i => ({ href: i.path, icon: i.icon, label: i.label }))
    }] : [])
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 80 }}
      className="fixed left-0 top-0 h-screen bg-slate-900 dark:bg-[#0a0c10] text-white flex flex-col z-50 border-r border-white/5"
    >
      <div className="p-6 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-8"
            >
              <img src="/logo.png" alt="Seu Pedido Já" className="h-full object-contain brightness-0 invert" />
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={toggle} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
          {isOpen ? <ChevronLeft size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto no-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            {isOpen && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4"
              >
                {group.title}
              </motion.h3>
            )}
            <div className="space-y-1">
              {group.items.map((item: any) => {
                const isActive = location === item.href;
                const showHighlight = item.isHighlighted && !isActive;
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
                      isActive 
                      ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
                      : showHighlight
                      ? 'bg-primary/5 border border-primary/20 text-white hover:bg-primary/10 shadow-sm'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}>
                      <item.icon size={20} className={isActive ? 'text-white' : showHighlight ? 'text-primary' : 'group-hover:text-white'} />
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-sm ${showHighlight ? 'font-bold text-white' : ''}`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                      {showHighlight && isOpen && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link href="/" className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          {isOpen && <span className="text-sm font-medium">Voltar ao Site</span>}
        </Link>
        
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white group"
        >
          <div className="relative">
            {isDark ? (
              <Sun size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Moon size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          {isOpen && <span className="text-sm font-medium">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 p-3 hover:bg-red-500/10 rounded-xl transition-all text-white/70 hover:text-red-400 group"
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Sair do Painel</span>}
        </button>
      </div>
    </motion.aside>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();
  const { restaurantId } = useAuth();
  const [, setLocation] = useLocation();

  // Robust check: use context OR direct localStorage
  const activeId = restaurantId || localStorage.getItem('restaurant_id');

  useEffect(() => {
    // Give a tiny bit of time for state to settle if needed, but check localStorage immediately
    const checkId = restaurantId || localStorage.getItem('restaurant_id');
    if (!checkId) {
      setLocation('/cadastro');
    }
  }, [activeId, restaurantId, setLocation]);

  if (!activeId) return null;
  
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <motion.main
        animate={{ marginLeft: isOpen ? 256 : 80 }}
        className="flex-1 min-h-screen transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </motion.main>
      <Toaster richColors position="top-right" />
    </div>
  );
};

const App = () => {
  const [location, setLocation] = useLocation();
  const [restaurantId, setRestaurantId] = useState<string>(localStorage.getItem('restaurant_id') || '');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const { data: restaurant } = trpc.restaurants.get.useQuery(
    { id: restaurantId },
    { enabled: !!restaurantId }
  );

  useEffect(() => {
    if (restaurant?.role) {
      setUserRole(restaurant.role as 'admin' | 'user');
    }
  }, [restaurant]);

  // Domain-based routing logic
  useEffect(() => {
    const hostname = window.location.hostname;
    const isDashboardDomain = hostname.startsWith('painel.');
    
    if (isDashboardDomain && location === '/') {
      setLocation('/admin');
    }
  }, [location, setLocation]);

  const login = (id: string) => {
    localStorage.setItem('restaurant_id', id);
    setRestaurantId(id);
  };

  const logout = () => {
    localStorage.removeItem('restaurant_id');
    setRestaurantId('');
    setUserRole('user');
  };

  return (
    <AuthContext.Provider value={{ restaurantId, role: userRole, login, logout }}>
      <SidebarProvider>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/cadastro" component={RegisterPage} />
          <Route path="/menu/:slug">
            {(params) => <PublicMenu slug={params.slug} />}
          </Route>

          <Route path="/admin/produtos">
            <Layout><MenuPage /></Layout>
          </Route>
          <Route path="/admin/categorias">
            <Layout><CategoriesPage /></Layout>
          </Route>
          <Route path="/admin/complementos">
            <Layout><OptionalsPage /></Layout>
          </Route>
          <Route path="/admin/cupons">
            <Layout><CouponsPage /></Layout>
          </Route>
          <Route path="/admin/relatorios">
            <Layout><ReportsPage /></Layout>
          </Route>
          <Route path="/admin/usuarios">
            <Layout><UsersPage /></Layout>
          </Route>
          <Route path="/admin/pagamentos">
            <Layout><PaymentsPage /></Layout>
          </Route>
          <Route path="/admin/planos">
            <Layout><PlansPage /></Layout>
          </Route>
          <Route path="/admin/clientes">
            <Layout><CustomersPage /></Layout>
          </Route>
          <Route path="/admin/mala-direta">
            <Layout><MarketingPage /></Layout>
          </Route>
          <Route path="/admin/gerenciar-lojas">
            <Layout><AdminUsersPage /></Layout>
          </Route>
          <Route path="/admin/analise-performance">
            <Layout><AdminAnalyticsPage /></Layout>
          </Route>
          <Route path="/admin/pagamentos-plataforma">
            <Layout><AdminPaymentsPage /></Layout>
          </Route>
          <Route path="/admin/relatorios-plataforma">
            <Layout><AdminReportsPage /></Layout>
          </Route>
          <Route path="/admin/configuracoes-plataforma">
            <Layout><AdminSettingsPage /></Layout>
          </Route>
          <Route path="/admin/configuracoes">
            <Layout><SettingsPage /></Layout>
          </Route>
          <Route path="/admin/pedidos">
            <Layout><OrdersPage /></Layout>
          </Route>
          <Route path="/admin/teste-whatsapp">
            <Layout><WhatsAppTestPage /></Layout>
          </Route>
          <Route path="/admin">
            <Layout><DashboardPage /></Layout>
          </Route>

          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </SidebarProvider>
    </AuthContext.Provider>
  );
};

export default App;
