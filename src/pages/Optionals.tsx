import React, { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, ListFilter, X, Pencil, Save, ListChecks, Info, PlusCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import LoadingScreen from '../components/LoadingScreen';

const OptionalsPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    is_mandatory: false,
    max_selection: 1
  });
  
  const [newItemData, setNewItemData] = useState({ name: '', price: '' });

  const utils = trpc.useContext();
  const { data: groups, isLoading } = trpc.optionals.listGroups.useQuery();
  const { data: restaurant } = trpc.restaurants.get.useQuery();

  const currentEditingGroup = useMemo(() => {
    return groups?.find(g => g.id === editingId) || null;
  }, [groups, editingId]);

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const amount = (parseInt(digits) / 100).toFixed(2);
    return amount.replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setNewItemData({ ...newItemData, price: formatted });
  };

  const createGroupMutation = trpc.optionals.createGroup.useMutation({
    onSuccess: () => {
      utils.optionals.listGroups.invalidate();
      toast.success('Grupo de opcionais criado!');
      closeForm();
    }
  });

  const updateGroupMutation = trpc.optionals.updateGroup.useMutation({
    onSuccess: () => {
      utils.optionals.listGroups.invalidate();
      toast.success('Grupo atualizado!');
      closeForm();
    }
  });

  const deleteGroupMutation = trpc.optionals.deleteGroup.useMutation({
    onSuccess: () => {
      utils.optionals.listGroups.invalidate();
      toast.success('Grupo removido');
    }
  });

  const createItemMutation = trpc.optionals.createItem.useMutation({
    onSuccess: () => {
      utils.optionals.listGroups.invalidate();
      toast.success('Item adicionado!');
      setNewItemData({ name: '', price: '' });
    }
  });

  const deleteItemMutation = trpc.optionals.deleteItem.useMutation({
    onSuccess: () => {
      utils.optionals.listGroups.invalidate();
      toast.success('Item removido');
    }
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', is_mandatory: false, max_selection: 1 });
    setNewItemData({ name: '', price: '' });
  };

  const handleStartEdit = (group: any) => {
    setEditingId(group.id);
    setFormData({ 
      name: group.name, 
      is_mandatory: group.isMandatory || false, 
      max_selection: group.maxSelection || 1 
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!formData.name) return toast.error('Nome do grupo é obrigatório');
    
    if (editingId) {
      updateGroupMutation.mutate({ id: editingId, ...formData });
    } else {
      createGroupMutation.mutate({ ...formData });
    }
  };

  const handleAddItem = () => {
    if (!newItemData.name || !editingId) return;
    const priceNum = parseFloat(newItemData.price.replace(',', '.')) || 0;
    createItemMutation.mutate({
      group_id: editingId,
      name: newItemData.name,
      price: priceNum
    });
  };

  if (isLoading) return <LoadingScreen message="Carregando opcionais..." />;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Opcionais</h2>
          <p className="text-slate-500 text-sm">Gerencie grupos de opções (ex: Bebidas, Molhos, Pontos da Carne).</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            Novo Grupo
          </button>
        )}
      </header>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-8"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <ListChecks size={24} />
                </div>
                <h3 className="text-xl font-bold dark:text-white">
                  {editingId ? `Editar: ${currentEditingGroup?.name || formData.name}` : 'Novo Grupo de Opcionais'}
                </h3>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    Nome do Grupo
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Escolha o sabor do suco..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Máx. Itens</label>
                    <input 
                      type="number" 
                      value={formData.max_selection}
                      onChange={(e) => setFormData({ ...formData, max_selection: parseInt(e.target.value) || 1 })}
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-8">
                    <div 
                      onClick={() => setFormData({ ...formData, is_mandatory: !formData.is_mandatory })}
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${formData.is_mandatory ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${formData.is_mandatory ? 'translate-x-7' : ''}`} />
                    </div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">Obrigatório?</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  Opções Disponíveis
                </label>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[200px] flex flex-col">
                  {editingId ? (
                    <div className="space-y-3 flex-1">
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto no-scrollbar">
                        {currentEditingGroup?.optional_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold dark:text-white">{item.name}</span>
                              <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">R$ {(Number(item.price) || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <button 
                              onClick={() => deleteItemMutation.mutate({ id: item.id })}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-auto">
                        <div className="flex-1 space-y-1">
                          <input 
                            type="text" 
                            placeholder="Nome da opção..."
                            value={newItemData.name}
                            onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                            className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-sm py-2 outline-none focus:border-primary dark:text-white"
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <input 
                            type="text" 
                            placeholder="0,00"
                            value={newItemData.price}
                            onChange={handlePriceChange}
                            className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-sm py-2 outline-none focus:border-primary dark:text-white font-bold"
                          />
                        </div>
                        <button 
                          onClick={handleAddItem}
                          disabled={createItemMutation.isLoading}
                          className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all self-end"
                        >
                          {createItemMutation.isLoading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" /> : <Plus size={20} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 grayscale">
                      <AlertCircle size={40} className="text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Salve o grupo primeiro para<br/>adicionar as opções individuais.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={closeForm} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={createGroupMutation.isLoading || updateGroupMutation.isLoading}
                className="px-12 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
              >
                {(createGroupMutation.isLoading || updateGroupMutation.isLoading) ? 'Salvando...' : <><Save size={20} /> {editingId ? 'Salvar Alterações' : 'Criar Grupo Completo'}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups?.map((group) => (
          <motion.div 
            layout
            key={group.id} 
            className={`bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border transition-all duration-300 flex flex-col relative ${
              editingId === group.id 
              ? 'border-primary ring-4 ring-primary/10 shadow-2xl' 
              : 'border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-black/5'
            }`}
          >
            <div className="p-7 pb-5 flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary">
                  <ListFilter size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{group.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {group.isMandatory && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">Obrigatório</span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">Máx: {group.maxSelection}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleStartEdit(group)}
                  className="p-2.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => { if(confirm('Excluir grupo?')) deleteGroupMutation.mutate({ id: group.id }) }}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="px-7 py-4 flex-1">
              <div className="space-y-2">
                {group.optional_items?.length > 0 ? (
                  group.optional_items.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">• {item.name}</span>
                      <span className="text-primary font-bold">R$ {(Number(item.price) || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600 italic">Nenhum item cadastrado</span>
                )}
                {group.optional_items?.length > 4 && (
                  <div className="text-[10px] text-slate-400 font-bold pt-1">
                    + {group.optional_items.length - 4} outras opções...
                  </div>
                )}
              </div>
            </div>

            <div className="h-2 w-full mt-2 bg-primary/20" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OptionalsPage;
