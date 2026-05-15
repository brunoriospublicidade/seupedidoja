import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Layers, 
  UtensilsCrossed, 
  PlusCircle, 
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  products: any[];
  optionalGroups: any[];
}

const BulkEditModal = ({ isOpen, onClose, categories, products, optionalGroups }: BulkEditModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  
  const utils = trpc.useContext();
  const bulkUpdateMutation = trpc.products.bulkUpdateOptionals.useMutation({
    onSuccess: (res) => {
      utils.products.list.invalidate();
      toast.success(`Sucesso! ${res.count} produtos atualizados.`);
      onClose();
      resetState();
    },
    onError: (err) => {
      toast.error('Erro ao atualizar produtos: ' + err.message);
    }
  });

  const resetState = () => {
    setStep(1);
    setSelectedCategoryId('');
    setSelectedProductIds([]);
    setSelectedOptionalIds([]);
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter(p => p.categoryId === selectedCategoryId);
  }, [selectedCategoryId, products]);

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const handleToggleOptional = (id: string) => {
    setSelectedOptionalIds(prev => 
      prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selectedProductIds.length === 0) {
      return toast.error('Selecione pelo menos um produto');
    }
    bulkUpdateMutation.mutate({
      productIds: selectedProductIds,
      optionalGroupIds: selectedOptionalIds
    });
  };

  const steps = [
    { id: 1, title: 'Categoria', icon: Layers },
    { id: 2, title: 'Produtos', icon: UtensilsCrossed },
    { id: 3, title: 'Opcionais', icon: PlusCircle },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-2xl font-bold dark:text-white">Edição em Massa</h3>
            <p className="text-slate-500 text-sm">Atualize múltiplos produtos de uma vez.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Wizard Progress */}
        <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mt-5 bg-slate-100 dark:bg-slate-800 relative">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      className="absolute inset-0 bg-primary"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 min-h-[350px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Selecione a Categoria</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setStep(2);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                          selectedCategoryId === cat.id 
                            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                            : 'border-slate-100 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/20 bg-slate-50 dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${selectedCategoryId === cat.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                            {cat.name}
                          </span>
                          <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: cat.color || '#F59E0B' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Selecione os Produtos ({selectedProductIds.length})
                  </label>
                  <button 
                    onClick={handleSelectAllProducts}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {selectedProductIds.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <AlertCircle size={32} />
                    </div>
                    <p className="text-slate-500">Nenhum produto encontrado nesta categoria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredProducts.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        className={`p-3 rounded-xl border flex items-center gap-4 transition-all ${
                          selectedProductIds.includes(prod.id)
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedProductIds.includes(prod.id) ? 'bg-primary border-primary text-white' : 'border-slate-200 dark:border-slate-700'
                        }`}>
                          {selectedProductIds.includes(prod.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-bold ${selectedProductIds.includes(prod.id) ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-400">R$ {parseFloat(prod.price).toFixed(2).replace('.', ',')}</p>
                        </div>
                        {prod.imageUrl && (
                          <img src={prod.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 items-start">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Os opcionais selecionados substituirão os atuais nos produtos escolhidos.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Escolha os Grupos de Opcionais</label>
                  <div className="grid grid-cols-1 gap-2">
                    {optionalGroups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => handleToggleOptional(group.id)}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          selectedOptionalIds.includes(group.id)
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedOptionalIds.includes(group.id) ? 'bg-primary border-primary text-white' : 'border-slate-200 dark:border-slate-700'
                          }`}>
                            {selectedOptionalIds.includes(group.id) && <Check size={14} strokeWidth={4} />}
                          </div>
                          <span className={`font-bold ${selectedOptionalIds.includes(group.id) ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                            {group.name}
                          </span>
                        </div>
                        {group.isMandatory && (
                          <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">Obrigatório</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <div>
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={20} />
                Voltar
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
            
            {step < 3 ? (
              <button 
                onClick={() => {
                  if (step === 1 && !selectedCategoryId) return toast.error('Selecione uma categoria');
                  if (step === 2 && selectedProductIds.length === 0) return toast.error('Selecione pelo menos um produto');
                  setStep(step + 1);
                }}
                className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                Próximo
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={bulkUpdateMutation.isLoading}
                className="bg-primary text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {bulkUpdateMutation.isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Aplicar Edição
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkEditModal;
