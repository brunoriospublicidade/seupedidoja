import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, ChevronLeft, Star, Clock, Info, Plus, Minus, X, User, MapPin, Phone, Send, CheckCircle2, Ticket, Lock, UserPlus, LogOut, Map } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../lib/trpc';

const PublicMenu = ({ slug }: { slug: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', neighborhood: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Auth & Profile State
  const [loggedCustomer, setLoggedCustomer] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    address: {
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP'
    }
  });
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const { data: menu, isLoading } = trpc.restaurants.getPublicMenu.useQuery({ slug });

  useEffect(() => {
    if (menu?.restaurant?.deliveryConfig) {
      const config = menu.restaurant.deliveryConfig as any;
      if (config.type === 'fixed') {
        setDeliveryFee(Number(config.fixedFee) || 0);
      } else if (config.type === 'neighborhood' && selectedNeighborhood) {
        setDeliveryFee(Number(selectedNeighborhood.fee) || 0);
      } else if (config.type === 'distance') {
        setDeliveryFee(Number(config.baseFee) || 0);
      } else {
        setDeliveryFee(0);
      }
    }
  }, [menu, selectedNeighborhood]);

  const filteredProducts = useMemo(() => {
    if (!menu) return [];
    return menu.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menu, searchTerm]);

  const categoriesWithProducts = useMemo(() => {
    if (!menu) return [];
    return menu.categories
      .map(cat => ({
        ...cat,
        products: filteredProducts.filter(p => p.categoryId === cat.id)
      }))
      .filter(cat => cat.products.length > 0);
  }, [menu, filteredProducts]);

  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const itemsPrice = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  
  // Recalcular desconto do cupom sempre que o preço dos itens mudar
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        setCouponDiscount(itemsPrice * (Number(appliedCoupon.value) / 100));
      } else {
        setCouponDiscount(Math.min(itemsPrice, Number(appliedCoupon.value) || 0));
      }
    } else {
      setCouponDiscount(0);
    }
  }, [appliedCoupon, itemsPrice]);

  const totalPrice = Math.max(0, itemsPrice + deliveryFee - couponDiscount);

  const [selectedOptionals, setSelectedOptionals] = useState<Record<string, string[]>>({});

  const addToCart = (product: any, quantity: number = 1) => {
    // Calcular preço total do item (base + opcionais)
    let extraPrice = 0;
    const choices: any[] = [];

    Object.entries(selectedOptionals).forEach(([groupId, itemIds]) => {
      const group = (menu?.optionalGroups || []).find((g: any) => g.id === groupId);
      if (group) {
        itemIds.forEach(itemId => {
          const item = (group.optional_items || []).find((i: any) => i.id === itemId);
          if (item) {
            extraPrice += Number(item.price) || 0;
            choices.push({ groupName: group.name, itemName: item.name, price: item.price });
          }
        });
      }
    });

    const finalPrice = Number(product.price) + extraPrice;
    const cartItemId = `${product.id}-${JSON.stringify(selectedOptionals)}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, price: finalPrice, quantity, choices, cartItemId }];
    });
    
    setActiveProduct(null);
    setSelectedOptionals({});
  };

  const toggleOptional = (groupId: string, itemId: string, maxSelection: number) => {
    setSelectedOptionals(prev => {
      const current = prev[groupId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [groupId]: current.filter(id => id !== itemId) };
      }
      if (maxSelection === 1) {
        return { ...prev, [groupId]: [itemId] };
      }
      if (current.length < maxSelection) {
        return { ...prev, [groupId]: [...current, itemId] };
      }
      return prev;
    });
  };

  const isOptionalGroupValid = (group: any) => {
    const selected = selectedOptionals[group.id] || [];
    if (group.isMandatory && selected.length === 0) return false;
    return true;
  };

  const isProductValid = useMemo(() => {
    if (!activeProduct) return false;
    const productOptionals = Array.isArray(activeProduct?.optionals) ? activeProduct.optionals : [];
    const groups = (menu?.optionalGroups || []).filter((g: any) => productOptionals.includes(g.id)) || [];
    return groups.every(isOptionalGroupValid);
  }, [activeProduct, selectedOptionals, menu]);

  const currentModalPrice = useMemo(() => {
    if (!activeProduct) return 0;
    let total = Number(activeProduct.price) || 0;
    Object.entries(selectedOptionals).forEach(([groupId, itemIds]) => {
      const group = (menu?.optionalGroups || []).find((g: any) => g.id === groupId);
      itemIds.forEach(itemId => {
        const item = (group?.optional_items || []).find((i: any) => i.id === itemId);
        if (item) total += Number(item.price) || 0;
      });
    });
    return total;
  }, [activeProduct, selectedOptionals, menu]);

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      // WhatsApp Redirection
      const deliveryConfig = menu?.restaurant?.deliveryConfig as any;
      const itemsText = cart.map(i => {
        let text = `${i.quantity}x ${i.name}`;
        if (i.choices && i.choices.length > 0) {
          const choicesList = i.choices.map((c: any) => `  + ${c.itemName}`).join('\n');
          text += `\n${choicesList}`;
        }
        return text;
      }).join('\n');

      const addressText = loggedCustomer && selectedAddressId 
        ? customerAddresses.find(a => a.id === selectedAddressId)?.address 
        : customer.address;

      const message = `*Novo Pedido!* 🍕\n\n` +
        `*Cliente:* ${customer.name}\n` +
        `*Telefone:* ${customer.phone}\n` +
        `*Endereço:* ${addressText}\n` +
        `*Bairro:* ${selectedNeighborhood?.name || customer.neighborhood || 'N/A'}\n\n` +
        `*Itens:*\n${itemsText}\n\n` +
        `*Total:* R$ ${totalPrice.toFixed(2)}\n` +
        (appliedCoupon ? `*Cupom:* ${appliedCoupon.code} (-R$ ${couponDiscount.toFixed(2)})\n` : '') +
        `*Pagamento:* Dinheiro (Troco p/ R$ 0,00)`;

      const encodedMessage = encodeURIComponent(message);
      const phone = menu?.restaurant?.phone?.replace(/\D/g, '') || '';
      if (phone) {
        window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
      }

      setOrderComplete(true);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      toast.success('Pedido enviado com sucesso!');
    },
    onError: (err) => {
      toast.error('Erro ao enviar pedido: ' + err.message);
    }
  });

  const validateCoupon = trpc.coupons.validate.useMutation({
    onSuccess: (res) => {
      if (res.valid && 'coupon' in res) {
        setAppliedCoupon(res.coupon);
        toast.success('Cupom aplicado com sucesso!');
      } else if ('message' in res) {
        toast.error(res.message);
      }
    }
  });

  const loginMutation = trpc.customerPortal.login.useMutation({
    onSuccess: (user) => {
      setLoggedCustomer(user);
      localStorage.setItem(`customer_${slug}`, JSON.stringify(user));
      setIsAuthModalOpen(false);
      setCustomer({ name: user.name, phone: user.phone, address: '', neighborhood: '' });
      toast.success(`Bem-vindo, ${user.name}!`);
    },
    onError: (err) => toast.error(err.message)
  });

  const registerMutation = trpc.customerPortal.register.useMutation({
    onSuccess: (user) => {
      setLoggedCustomer(user);
      localStorage.setItem(`customer_${slug}`, JSON.stringify(user));
      setIsAuthModalOpen(false);
      setCustomer({ name: user.name, phone: user.phone, address: '', neighborhood: '' });
      refetchAddresses();
      toast.success('Cadastro realizado com sucesso!');
    },
    onError: (err) => toast.error(err.message)
  });

  const { data: addressesData, refetch: refetchAddresses } = trpc.customerPortal.listAddresses.useQuery(
    { customerId: loggedCustomer?.id },
    { enabled: !!loggedCustomer }
  );

  useEffect(() => {
    if (addressesData) {
      setCustomerAddresses(addressesData);
      if (addressesData.length > 0 && !selectedAddressId) {
        setSelectedAddressId(addressesData[0].id);
      }
    }
  }, [addressesData]);

  useEffect(() => {
    const saved = localStorage.getItem(`customer_${slug}`);
    if (saved) {
      const user = JSON.parse(saved);
      setLoggedCustomer(user);
      setCustomer({ name: user.name, phone: user.phone, address: '', neighborhood: '' });
    }
  }, [slug]);

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    validateCoupon.mutate({ code: couponCode, restaurantId: menu!.restaurant.id });
  };

  const addAddressMutation = trpc.customerPortal.addAddress.useMutation({
    onSuccess: (addr) => {
      refetchAddresses();
      setSelectedAddressId(addr.id);
      setIsAddingAddress(false);
      setNewAddressForm({ name: '', cep: '', address: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
      toast.success('Endereço adicionado!');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSaveAddress = () => {
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.neighborhood) {
      return toast.error('Preencha os campos obrigatórios do endereço.');
    }
    addAddressMutation.mutate({
      customerId: loggedCustomer.id,
      ...newAddressForm
    });
  };

  const handleFinishOrder = () => {
    if (!customer.name || !customer.phone) {
      return toast.error('Nome e Telefone são obrigatórios');
    }
    
    const deliveryConfig = menu?.restaurant?.deliveryConfig as any;
    if (deliveryConfig?.type === 'neighborhood' && !selectedNeighborhood) {
      return toast.error('Por favor, selecione seu bairro para o cálculo do frete.');
    }

    createOrder.mutate({
      restaurantId: menu!.restaurant.id,
      items: cart,
      total: totalPrice,
      couponId: appliedCoupon?.id,
      customerId: loggedCustomer?.id,
      customer: {
        ...customer,
        neighborhood: selectedNeighborhood?.name || '',
        address: loggedCustomer && selectedAddressId 
          ? customerAddresses.find(a => a.id === selectedAddressId)?.address 
          : customer.address
      }
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!menu) return <div className="p-20 text-center">Restaurante não encontrado.</div>;

  const deliveryConfig = menu.restaurant.deliveryConfig as any;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header / Banner */}
      <div className="h-48 bg-slate-200 relative overflow-hidden">
        <img 
          src={menu.restaurant.bannerUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80"} 
          className="w-full h-full object-cover"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Restaurant Info */}
      <div className="max-w-4xl mx-auto -mt-16 relative px-4 z-10">
        <div className="bg-white p-6 rounded-[32px] shadow-2xl flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left border border-slate-100">
          <div className="w-32 h-32 rounded-[32px] bg-white p-1 shadow-2xl -mt-20 md:-mt-16 border-[6px] border-white overflow-hidden flex-shrink-0">
            <img src={menu.restaurant.logoUrl || ""} alt="Logo" className="w-full h-full object-contain rounded-[24px]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-800">{menu.restaurant.name || 'Restaurante'}</h1>
              {loggedCustomer ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-slate-800">{loggedCustomer.name}</div>
                    <button 
                      onClick={() => {
                        localStorage.removeItem(`customer_${slug}`);
                        setLoggedCustomer(null);
                        toast.success('Você saiu da sua conta.');
                      }}
                      className="text-[10px] text-rose-500 font-bold uppercase tracking-widest"
                    >
                      Sair
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {loggedCustomer.name.charAt(0)}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  <User size={16} />
                  Entrar / Cadastrar
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-amber-500"><Star size={16} fill="currentColor" /> 4.8</span>
              <span className="flex items-center gap-1"><Clock size={16} /> 30-45 min</span>
              <span className="flex items-center gap-1">
                <DollarSign size={16} /> 
                {deliveryFee === 0 ? 'Entrega Grátis' : `Entrega: R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="sticky top-0 z-40 bg-white shadow-sm mt-6">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar no cardápio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {categoriesWithProducts.map(cat => (
              <button
                key={cat.id}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === cat.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white border border-slate-100 text-slate-500'
                }`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-10">
        {categoriesWithProducts.map(cat => (
          <section key={cat.id} id={`cat-${cat.id}`} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">{cat.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.products.map((product: any) => (
                <div 
                  key={product.id} 
                  onClick={() => setActiveProduct(product)}
                  className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-slate-800">{product.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                    <div className="pt-2 font-bold text-slate-800">R$ {(Number(product.price) || 0).toFixed(2).replace('.', ',')}</div>
                  </div>
                  {product.imageUrl && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {activeProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-2xl rounded-t-[40px] md:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="relative h-64 bg-slate-100">
                <img src={activeProduct.imageUrl} className="w-full h-full object-cover" alt={activeProduct.name} />
                <button 
                  onClick={() => setActiveProduct(null)}
                  className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{activeProduct.name}</h2>
                  <p className="text-slate-500 mt-2">{activeProduct.description}</p>
                  <div className="text-xl font-bold text-primary mt-4">R$ {(Number(activeProduct.price) || 0).toFixed(2).replace('.', ',')}</div>
                </div>

                {/* Optional Groups */}
                {(menu?.optionalGroups || [])
                  .filter(group => {
                    const productOptionals = Array.isArray(activeProduct?.optionals) 
                      ? activeProduct.optionals 
                      : [];
                    return productOptionals.includes(group.id);
                  })
                  .map(group => (
                    <div key={group.id} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            {group.name}
                            {group.isMandatory && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded">Obrigatório</span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400">Escolha até {group.maxSelection} {group.maxSelection === 1 ? 'opção' : 'opções'}.</p>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase">
                          {(selectedOptionals[group.id] || []).length} / {group.maxSelection}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {group.optional_items.map((item: any) => {
                          const isSelected = (selectedOptionals[group.id] || []).includes(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleOptional(group.id, item.id, group.maxSelection || 1)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isSelected 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'border-primary bg-primary' : 'border-slate-200'
                                }`}>
                                  {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className="text-sm font-bold">{item.name}</span>
                              </div>
                              {Number(item.price) > 0 && (
                                <span className="text-xs font-black">+ R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4">
                <button 
                  onClick={() => addToCart(activeProduct)}
                  disabled={!isProductValid}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                  {isProductValid ? (
                    <>Adicionar <span className="opacity-60">•</span> R$ {currentModalPrice.toFixed(2).replace('.', ',')}</>
                  ) : (
                    'Selecione os itens obrigatórios'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 inset-x-0 px-4 z-40 max-w-lg mx-auto"
          >
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-primary p-4 rounded-[28px] shadow-2xl flex items-center justify-between text-white active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center font-bold">
                  {totalItems}
                </div>
                <div className="text-left">
                  <div className="font-bold">Ver sacola</div>
                  <div className="text-xs opacity-80">R$ {(Number(totalPrice) || 0).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
              <ShoppingBag size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[40px] md:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">Finalizar Pedido</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar">
                {orderComplete ? (
                  <div className="py-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-slate-800">Pedido Enviado!</h4>
                      <p className="text-slate-500 font-medium">Seu pedido foi recebido pelo restaurante.</p>
                    </div>
                    <button 
                      onClick={() => { setIsCheckoutOpen(false); setOrderComplete(false); }}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                    >
                      Voltar ao Cardápio
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Top Call to Action (Login/Register) */}
                    {!loggedCustomer && (
                      <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Resumo da sua Sacola</h4>
                            <div className="text-2xl font-black text-slate-800">
                              R$ {(Number(totalPrice) || 0).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                            <ShoppingBag size={24} />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-primary/10">
                          <p className="text-xs text-slate-600 font-medium mb-3">
                            Entre ou cadastre-se para salvar seus endereços e ganhar tempo nos próximos pedidos!
                          </p>
                          <button 
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <LogIn size={14} /> Fazer Login / Cadastro
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Item List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seu Carrinho</h4>
                        {loggedCustomer && (
                          <div className="text-sm font-black text-primary">
                            R$ {(Number(totalPrice) || 0).toFixed(2).replace('.', ',')}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {cart.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="font-bold text-slate-800">
                                {item.quantity}x {item.name}
                              </div>
                              <div className="font-bold text-slate-800 text-sm">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                            {item.choices && item.choices.length > 0 && (
                              <div className="space-y-1">
                                {item.choices.map((choice: any, cIdx: number) => (
                                  <div key={cIdx} className="text-xs text-slate-500 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    {choice.itemName} {Number(choice.price) > 0 && `(+ R$ ${Number(choice.price).toFixed(2)})`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      {!loggedCustomer && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <User size={12} className="text-primary" /> Seu Nome
                            </label>
                            <input 
                              type="text" 
                              value={customer.name}
                              onChange={(e) => setCustomer({...customer, name: e.target.value})}
                              placeholder="Como quer ser chamado?"
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Phone size={12} className="text-primary" /> Seu WhatsApp
                            </label>
                            <input 
                              type="tel" 
                              value={customer.phone}
                              onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                              placeholder="(00) 00000-0000"
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                            />
                          </div>
                        </>
                      )}

                      {loggedCustomer && customerAddresses.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <MapPin size={12} className="text-primary" /> Meus Endereços
                            </label>
                            <button 
                              onClick={() => setIsAddingAddress(!isAddingAddress)}
                              className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full"
                            >
                              {isAddingAddress ? 'Cancelar' : '+ Novo'}
                            </button>
                          </div>

                          {isAddingAddress ? (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400">Nome do Local (Ex: Casa)</label>
                                <input 
                                  type="text" 
                                  value={newAddressForm.name}
                                  onChange={(e) => setNewAddressForm({...newAddressForm, name: e.target.value})}
                                  placeholder="Minha Casa"
                                  className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400">CEP</label>
                                  <input 
                                    type="text" 
                                    value={newAddressForm.cep}
                                    onChange={(e) => setNewAddressForm({...newAddressForm, cep: e.target.value})}
                                    placeholder="00000-000"
                                    className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400">Bairro</label>
                                  <input 
                                    type="text" 
                                    value={newAddressForm.neighborhood}
                                    onChange={(e) => setNewAddressForm({...newAddressForm, neighborhood: e.target.value})}
                                    placeholder="Centro"
                                    className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400">Endereço (Rua)</label>
                                <input 
                                  type="text" 
                                  value={newAddressForm.address}
                                  onChange={(e) => setNewAddressForm({...newAddressForm, address: e.target.value})}
                                  placeholder="Av. Principal"
                                  className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400">Número</label>
                                  <input 
                                    type="text" 
                                    value={newAddressForm.number}
                                    onChange={(e) => setNewAddressForm({...newAddressForm, number: e.target.value})}
                                    placeholder="123"
                                    className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400">Cidade/UF</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={newAddressForm.city}
                                      onChange={(e) => setNewAddressForm({...newAddressForm, city: e.target.value, state: 'SP'})}
                                      placeholder="Cidade"
                                      className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={handleSaveAddress}
                                disabled={addAddressMutation.isLoading}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                              >
                                {addAddressMutation.isLoading ? 'Salvando...' : 'Salvar Endereço'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {customerAddresses.map((addr) => (
                                <button
                                  key={addr.id}
                                  onClick={() => setSelectedAddressId(addr.id)}
                                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3 ${
                                    selectedAddressId === addr.id
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-slate-100 bg-white shadow-sm'
                                  }`}
                                >
                                  <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-slate-200'}`}>
                                    {selectedAddressId === addr.id && <CheckCircle2 size={10} className="text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-800">{addr.name}</div>
                                    <div className="text-[10px] text-slate-500 line-clamp-1">{addr.address}, {addr.number} - {addr.neighborhood}</div>
                                  </div>
                                </button>
                              ))}
                              {customerAddresses.length === 0 && (
                                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                  <Map size={24} className="mx-auto text-slate-200 mb-2" />
                                  <p className="text-xs text-slate-400 font-medium">Nenhum endereço salvo.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {!loggedCustomer || customerAddresses.length === 0 ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <MapPin size={12} className="text-primary" /> Bairro de Entrega
                            </label>
                            {deliveryConfig?.type === 'neighborhood' ? (
                              <select 
                                value={selectedNeighborhood?.name || ''}
                                onChange={(e) => {
                                  const nb = (deliveryConfig.neighborhoods || []).find((n: any) => n.name === e.target.value);
                                  setSelectedNeighborhood(nb);
                                }}
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                              >
                                <option value="">Selecione seu bairro...</option>
                                {(deliveryConfig.neighborhoods || []).map((nb: any, i: number) => (
                                  <option key={i} value={nb.name}>{nb.name} (R$ {Number(nb.fee).toFixed(2)})</option>
                                ))}
                              </select>
                            ) : (
                              <input 
                                type="text"
                                placeholder="Seu bairro"
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                disabled
                                value={menu.restaurant.neighborhood || ''}
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <MapPin size={12} className="text-primary" /> Endereço Completo
                            </label>
                            <textarea 
                              rows={3}
                              value={customer.address}
                              onChange={(e) => setCustomer({...customer, address: e.target.value})}
                              placeholder="Rua, número e complemento..."
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold resize-none"
                            />
                          </div>
                        </>
                      ) : null}

                      {/* Coupon Field */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Ticket size={12} className="text-primary" /> Cupom de Desconto
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="CUPOM20"
                            disabled={!!appliedCoupon}
                            className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold placeholder:text-slate-300 disabled:opacity-50"
                          />
                          {appliedCoupon ? (
                            <button 
                              onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                              className="px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold hover:bg-rose-100"
                            >
                              Remover
                            </button>
                          ) : (
                            <button 
                              onClick={handleApplyCoupon}
                              disabled={!couponCode || validateCoupon.isLoading}
                              className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                            >
                              {validateCoupon.isLoading ? '...' : 'Aplicar'}
                            </button>
                          )}
                        </div>
                        {appliedCoupon && (
                          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Cupom "{appliedCoupon.code}" aplicado!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-slate-400 font-bold text-xs">
                          <span>Subtotal ({totalItems} itens)</span>
                          <span>R$ {(Number(itemsPrice) || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 font-bold text-xs">
                          <span>Taxa de Entrega</span>
                          <span>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-emerald-600 font-bold text-xs">
                            <span>Desconto Cupom</span>
                            <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-slate-800 font-black text-lg pt-2">
                          <span>Total</span>
                          <span className="text-primary">R$ {(Number(totalPrice) || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                      <button 
                        onClick={handleFinishOrder}
                        disabled={createOrder.isLoading}
                        className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {createOrder.isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={20} /> Enviar Pedido</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal (Login/Register) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl p-8 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800">
                    {authMode === 'login' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {authMode === 'login' ? 'Entre para gerenciar seus endereços e pedidos.' : 'Cadastre-se para uma experiência completa.'}
                  </p>
                </div>
                <button onClick={() => setIsAuthModalOpen(false)} className="p-2 bg-slate-50 rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                        placeholder="João Silva"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                  <div className="relative">
                    <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      placeholder="seu@email.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="tel" 
                          value={authForm.phone}
                          onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                          placeholder="(00) 00000-0000"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Endereço de Entrega</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CEP</label>
                          <input 
                            type="text" 
                            value={authForm.address.cep}
                            onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, cep: e.target.value}})}
                            placeholder="00000-000"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bairro</label>
                          <input 
                            type="text" 
                            value={authForm.address.neighborhood}
                            onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, neighborhood: e.target.value}})}
                            placeholder="Centro"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rua / Endereço</label>
                          <input 
                            type="text" 
                            value={authForm.address.address}
                            onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, address: e.target.value}})}
                            placeholder="Av. Brasil"
                            className="w-full px-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número</label>
                            <input 
                              type="text" 
                              value={authForm.address.number}
                              onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, number: e.target.value}})}
                              placeholder="123"
                              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</label>
                            <input 
                              type="text" 
                              value={authForm.address.city}
                              onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, city: e.target.value}})}
                              placeholder="São Paulo"
                              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto px-1 custom-scrollbar space-y-4">
                {authMode === 'register' && (
                  <div className="pt-2 border-t border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Endereço para Entrega</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400">CEP</label>
                        <input 
                          type="text" 
                          value={authForm.address.cep}
                          onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, cep: e.target.value}})}
                          placeholder="00000-000"
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400">Bairro</label>
                        <input 
                          type="text" 
                          value={authForm.address.neighborhood}
                          onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, neighborhood: e.target.value}})}
                          placeholder="Centro"
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">Endereço (Rua)</label>
                      <input 
                        type="text" 
                        value={authForm.address.address}
                        onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, address: e.target.value}})}
                        placeholder="Ex: Av. Brasil"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400">Número</label>
                        <input 
                          type="text" 
                          value={authForm.address.number}
                          onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, number: e.target.value}})}
                          placeholder="123"
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400">Cidade</label>
                        <input 
                          type="text" 
                          value={authForm.address.city}
                          onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, city: e.target.value}})}
                          placeholder="Sua Cidade"
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">Complemento</label>
                      <input 
                        type="text" 
                        value={authForm.address.complement}
                        onChange={(e) => setAuthForm({...authForm, address: {...authForm.address, complement: e.target.value}})}
                        placeholder="Ex: Apto 101"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  if (authMode === 'login') {
                    loginMutation.mutate({ restaurantId: menu.restaurant.id, email: authForm.email, password: authForm.password });
                  } else {
                    if (!authForm.name || !authForm.email || !authForm.password || !authForm.phone) {
                      return toast.error('Preencha os dados pessoais básicos.');
                    }
                    if (!authForm.address.address || !authForm.address.neighborhood || !authForm.address.number || !authForm.address.city || !authForm.address.cep) {
                      return toast.error('Por favor, preencha o endereço completo para entrega.');
                    }
                    registerMutation.mutate({ restaurantId: menu.restaurant.id, ...authForm });
                  }
                }}
                disabled={loginMutation.isLoading || registerMutation.isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loginMutation.isLoading || registerMutation.isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  authMode === 'login' ? <>Entrar Agora <Lock size={18} /></> : <>Criar Minha Conta <UserPlus size={18} /></>
                )}
              </button>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  {authMode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicMenu;

const DollarSign = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
