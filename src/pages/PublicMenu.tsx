import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, ChevronLeft, Star, Clock, Info, Plus, Minus, X, User, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../lib/trpc';

const PublicMenu = ({ slug }: { slug: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

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
  const totalPrice = itemsPrice + deliveryFee;

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
    onSuccess: () => {
      setOrderComplete(true);
      setCart([]);
      toast.success('Pedido enviado com sucesso!');
    },
    onError: (err) => {
      toast.error('Erro ao enviar pedido: ' + err.message);
    }
  });

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
      customer: {
        ...customer,
        neighborhood: selectedNeighborhood?.name || ''
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
      <div className="max-w-4xl mx-auto -mt-12 relative px-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg -mt-16 md:-mt-12 border border-slate-100 overflow-hidden">
            <img src={menu.restaurant.logoUrl || ""} alt="Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">{menu.restaurant.name || 'Restaurante'}</h1>
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
                              onClick={() => toggleOptional(group.id, item.id, group.maxSelection)}
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
                    {/* Item List */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seu Carrinho</h4>
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
    </div>
  );
};

export default PublicMenu;

const DollarSign = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
