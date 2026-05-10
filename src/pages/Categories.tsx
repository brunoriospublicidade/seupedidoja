import React, { useState, useMemo } from 'react';
import { Plus, LayoutGrid, Hash, Layers, X, PlusCircle, Pencil, Trash2, Save, Palette, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';

const CategoriesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#ef4444'
  });
  const [newSubName, setNewSubName] = useState('');

  const utils = trpc.useContext();
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  
  // Encontrar a categoria sendo editada a partir da lista atualizada
  const currentEditingCategory = useMemo(() => {
    return categories?.find(c => c.id === editingId) || null;
  }, [categories, editingId]);

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria criada!');
      closeForm();
    }
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria atualizada!');
      closeForm();
    }
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Categoria removida');
    }
  });

  const createSubMutation = trpc.categories.createSubcategory.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Subcategoria adicionada!');
      setNewSubName('');
    }
  });

  const deleteSubMutation = trpc.categories.deleteSubcategory.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success('Subcategoria removida');
    }
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', color: '#ef4444' });
    setNewSubName('');
  };

  const handleStartEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({ name: category.name, color: category.color });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!formData.name) return toast.error('Nome é obrigatório');
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate({ ...formData });
    }
  };

  const handleAddSubcategory = () => {
    if (!newSubName || !editingId) return;
    createSubMutation.mutate({ category_id: editingId, name: newSubName });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Carregando categorias...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Categorias</h2>
          <p className="text-slate-500 text-sm">Organize seu cardápio em seções e subcategorias.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            Nova Categoria
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
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: formData.color + '20', color: formData.color }}
                >
                  <LayoutGrid size={24} />
                </div>
                <h3 className="text-xl font-bold dark:text-white">
                  {editingId ? `Editar: ${currentEditingCategory?.name || formData.name}` : 'Nova Categoria'}
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
                    <Type size={16} className="text-primary" /> Nome da Categoria
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pizzas, Bebidas..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Palette size={16} className="text-primary" /> Cor de Destaque
                  </label>
                  <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <input 
                      type="color" 
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-slate-500 font-mono uppercase text-sm font-bold tracking-wider">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Layers size={16} className="text-primary" /> Subcategorias
                </label>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[160px] flex flex-col">
                  {editingId ? (
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {currentEditingCategory?.subcategories?.map((sub: any) => (
                          <div key={sub.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{sub.name}</span>
                            <button 
                              onClick={() => deleteSubMutation.mutate({ id: sub.id })}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-auto">
                        <input 
                          type="text" 
                          placeholder="Nova subcategoria..."
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory()}
                          className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-sm py-2 outline-none focus:border-primary dark:text-white"
                        />
                        <button 
                          onClick={handleAddSubcategory}
                          className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                          {createSubMutation.isLoading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" /> : <Plus size={20} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 grayscale">
                      <Layers size={40} className="text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Salve a categoria primeiro para<br/>gerenciar subcategorias.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={closeForm} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-12 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
              >
                {(createMutation.isLoading || updateMutation.isLoading) ? 'Salvando...' : <><Save size={20} /> {editingId ? 'Salvar Alterações' : 'Criar Categoria'}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories?.map((category) => (
          <motion.div 
            layout
            key={category.id} 
            className={`bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border transition-all duration-300 flex flex-col ${
              editingId === category.id 
              ? 'border-primary ring-4 ring-primary/10 shadow-2xl' 
              : 'border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-black/5'
            }`}
          >
            <div className="p-7 pb-5 flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: (category.color || '#F59E0B') + '20', color: category.color || '#F59E0B' }}
                >
                  <LayoutGrid size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{category.name}</h3>
                  <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Hash size={14} className="text-slate-300" />
                    {category.productCount} produtos
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleStartEdit(category)}
                  className="p-2.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => { if(confirm('Excluir categoria?')) deleteMutation.mutate({ id: category.id }) }}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="px-7 py-4 flex-1">
              <div className="flex flex-wrap gap-2">
                {category.subcategories?.length > 0 ? (
                  category.subcategories.map((sub: any) => (
                    <span key={sub.id} className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-400 border border-slate-100 dark:border-slate-700">
                      {sub.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600 italic">Sem subcategorias</span>
                )}
              </div>
            </div>

            <div className="h-2 w-full mt-2" style={{ backgroundColor: category.color || '#F59E0B' }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
