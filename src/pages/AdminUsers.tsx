import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  Trash2,
  Pencil,
  X,
  MapPin,
  Home,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  Layout
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

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

const AdminUsersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    food_type: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    phone: '',
    subscription_plan: 'bronze'
  });

  const { data: restaurants, isLoading, refetch } = trpc.restaurants.listAll.useQuery();

  const createMutation = trpc.restaurants.create.useMutation({
    onSuccess: () => {
      toast.success('Loja criada com sucesso!');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error('Erro ao criar: ' + err.message)
  });

  const updateMutation = trpc.restaurants.update.useMutation({
    onSuccess: () => {
      toast.success('Loja atualizada com sucesso!');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message)
  });

  const deleteMutation = trpc.restaurants.delete.useMutation({
    onSuccess: () => {
      toast.success('Loja removida com sucesso!');
      refetch();
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message)
  });

  const resetForm = () => {
    setFormData({
      name: '', food_type: '', cep: '', street: '', number: '', 
      complement: '', neighborhood: '', city: '', state: '', 
      phone: '', subscription_plan: 'bronze'
    });
    setEditingId(null);
  };

  const handleEdit = (res: any) => {
    setEditingId(res.id);
    // Parse address string if possible or just populate fields
    // For now, let's assume we can't perfectly parse the concatenated string back to fields easily
    // In a real app, we'd have these columns separate.
    setFormData({
      name: res.name || '',
      food_type: res.food_type || '',
      cep: '', // These would ideally come from separate columns
      street: res.address || '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      phone: res.phone || '',
      subscription_plan: res.subscription_plan || 'bronze'
    });
    setIsModalOpen(true);
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
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            cep: cleanCep.replace(/^(\d{5})(\d{3})/, '$1-$2')
          }));
          toast.success('Endereço localizado!');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city}/${formData.state}`;
    
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        food_type: formData.food_type,
        address: fullAddress,
        phone: formData.phone,
        subscription_plan: formData.subscription_plan
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        food_type: formData.food_type,
        address: fullAddress,
        phone: formData.phone,
        email: 'admin-created@pedidoja.com' // Placeholder for admin creations
      });
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             Gestão de Lojas <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{restaurants?.length || 0} total</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Controle total sobre todos os restaurantes da plataforma.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={20} />
          Nova Loja
        </button>
      </header>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Restaurante</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Contato</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Plano</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {restaurants?.map((res) => (
                <tr key={res.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                        {res.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           {res.name}
                           <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-black uppercase">{res.food_type}</span>
                        </div>
                        <div className="text-xs text-primary font-bold flex items-center gap-1 cursor-pointer hover:underline" onClick={() => window.open(`/menu/${res.slug}`, '_blank')}>
                           <Globe size={10} /> /{res.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{res.phone}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[200px]">{res.address}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      res.subscription_plan === 'gold' ? 'bg-amber-100 text-amber-700' : 
                      res.subscription_plan === 'prata' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {res.subscription_plan || 'bronze'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(res)} className="p-2 text-slate-300 hover:text-primary transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => deleteMutation.mutate({ id: res.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">{editingId ? 'Editar Loja' : 'Cadastrar Nova Loja'}</h3>
                  <p className="text-slate-500 text-xs">Preencha todos os dados para {editingId ? 'atualizar' : 'ativar'} o restaurante.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto no-scrollbar space-y-8">
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Building2 size={14} /> Dados do Negócio
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome do Restaurante</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="Ex: Burger King"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de Comida</label>
                      <select 
                        required
                        value={formData.food_type}
                        onChange={(e) => setFormData({...formData, food_type: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none"
                      >
                        <option value="">Selecione...</option>
                        {FOOD_TYPES.map(f => <option key={f.label} value={f.label}>{f.icon} {f.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin size={14} /> Endereço Completo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">CEP</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={formData.cep}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({...formData, cep: val});
                            if (val.length === 8) handleCepLookup(val);
                          }}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                          placeholder="00000-000"
                        />
                        {isCepLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Número</label>
                      <input 
                        type="text" 
                        value={formData.number}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Rua / Logradouro</label>
                    <input 
                      type="text" 
                      value={formData.street}
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Bairro</label>
                      <input 
                        type="text" 
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Complemento</label>
                      <input 
                        type="text" 
                        value={formData.complement}
                        onChange={(e) => setFormData({...formData, complement: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="Sala, Apto..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Cidade</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado (UF)</label>
                      <input 
                        type="text" 
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                        maxLength={2}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="SP"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato e Plano */}
                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Zap size={14} /> Contato e Assinatura
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">WhatsApp</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Plano da Plataforma</label>
                      <select 
                        value={formData.subscription_plan}
                        onChange={(e) => setFormData({...formData, subscription_plan: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none"
                      >
                        <option value="bronze">Bronze (Grátis)</option>
                        <option value="prata">Prata (Profissional)</option>
                        <option value="gold">Gold (Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="flex-1 py-5 bg-primary text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {(createMutation.isLoading || updateMutation.isLoading) ? <Loader2 className="animate-spin" size={24} /> : editingId ? 'Salvar Alterações' : 'Criar Loja'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsersPage;
