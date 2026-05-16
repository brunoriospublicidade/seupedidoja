import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Utensils, 
  Package, 
  PlusCircle, 
  X,
  Loader2,
  CheckCircle2,
  ChefHat
} from 'lucide-react';
import { WIZARD_DATA, COMMON_COMPLEMENTS } from '../lib/wizard-data';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

interface MenuWizardProps {
  restaurant: any;
  onComplete: () => void;
  onSkip: () => void;
}

const MenuWizard: React.FC<MenuWizardProps> = ({ restaurant, onComplete, onSkip }) => {
  const [step, setStep] = useState(0); // 0: Question, 1: Categories, 2: Products, 3: Optionals, 4: Complements, 5: Summary
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOptionals, setSelectedOptionals] = useState<any[]>([]);
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  
  const wizardSave = trpc.wizard.saveBatch.useMutation({
    onSuccess: () => {
      toast.success('Cardápio configurado com sucesso!');
      onComplete();
    },
    onError: (err) => {
      toast.error('Erro ao salvar cardápio: ' + err.message);
    }
  });

  const foodType = restaurant?.foodType || 'Hamburgueria';
  const data = WIZARD_DATA[foodType] || WIZARD_DATA['Hamburgueria'];

  // Initialize selections based on food type suggestions
  useEffect(() => {
    if (data) {
      setSelectedCategories(data.categories);
      setSelectedProducts(data.products);
      setSelectedOptionals(data.optionals);
      setSelectedComplements(COMMON_COMPLEMENTS);
    }
  }, [foodType]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleProduct = (prod: string) => {
    setSelectedProducts(prev => 
      prev.includes(prod) ? prev.filter(p => p !== prod) : [...prev, prod]
    );
  };

  const toggleOptional = (group: any) => {
    setSelectedOptionals(prev => 
      prev.some(g => g.name === group.name) 
        ? prev.filter(g => g.name !== group.name) 
        : [...prev, group]
    );
  };

  const toggleComplement = (comp: string) => {
    setSelectedComplements(prev => 
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  const handleFinish = () => {
    const complementsAsOptionals = selectedComplements.map(name => ({
      name,
      items: ['Sim']
    }));

    wizardSave.mutate({
      categories: selectedCategories,
      products: selectedProducts,
      optionals: [...selectedOptionals, ...complementsAsOptionals]
    });
  };

  const steps = [
    { title: 'IA Assistente', icon: Sparkles },
    { title: 'Categorias', icon: Package },
    { title: 'Produtos', icon: Utensils },
    { title: 'Opcionais', icon: PlusCircle },
    { title: 'Finalizando', icon: CheckCircle2 }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onSkip}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[700px]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 p-8 border-r border-slate-100 dark:border-slate-800 hidden md:flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
              <ChefHat size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white leading-tight">Menu AI</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Onboarding</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {steps.map((s, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-3 transition-all ${
                  step === idx + 1 || (step === 0 && idx === 0) 
                    ? 'text-primary scale-105' 
                    : step > idx + 1 
                    ? 'text-emerald-500' 
                    : 'text-slate-400'
                }`}
              >
                <div className={`p-2 rounded-xl border ${
                  step === idx + 1 || (step === 0 && idx === 0)
                    ? 'border-primary bg-primary/5' 
                    : step > idx + 1
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  {step > idx + 1 ? <Check size={16} strokeWidth={3} /> : <s.icon size={16} />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{s.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onSkip}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
            >
              Configurar Manualmente
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-[40px] flex items-center justify-center animate-pulse">
                    <Sparkles size={48} />
                  </div>
                  <div className="space-y-4 max-w-md">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white leading-tight">
                      Que tal uma ajuda para montar seu cardápio? 🚀
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                      Detectamos que você tem uma <span className="font-bold text-primary">{foodType}</span>. 
                      Podemos sugerir as melhores categorias, produtos e opcionais para você começar.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-primary text-white rounded-[24px] font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      Sim, me ajude! <ChevronRight size={20} />
                    </button>
                    <button 
                      onClick={onSkip}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[24px] font-black hover:bg-slate-200 transition-all"
                    >
                      Agora não
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Sugestões de Categorias 📂</h3>
                    <p className="text-slate-500 text-sm">Selecione quais categorias você terá no seu cardápio.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-4 rounded-3xl border-2 transition-all text-left group relative ${
                          selectedCategories.includes(cat)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-sm">{cat}</span>
                        {selectedCategories.includes(cat) && (
                          <div className="absolute top-2 right-2 p-1 bg-primary text-white rounded-lg scale-75">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Sugestões de Produtos 🍔</h3>
                    <p className="text-slate-500 text-sm">Selecione os produtos iniciais que gostaria de adicionar.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.products.map((prod: string) => (
                      <button
                        key={prod}
                        onClick={() => toggleProduct(prod)}
                        className={`p-4 rounded-3xl border-2 transition-all text-left group relative ${
                          selectedProducts.includes(prod)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-sm">{prod}</span>
                        {selectedProducts.includes(prod) && (
                          <div className="absolute top-2 right-2 p-1 bg-primary text-white rounded-lg scale-75">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Opcionais Inteligentes 💡</h3>
                    <p className="text-slate-500 text-sm">Grupos de opcionais que facilitam o pedido do seu cliente.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {data.optionals.map((group: any) => (
                      <div
                        key={group.name}
                        onClick={() => toggleOptional(group)}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group relative ${
                          selectedOptionals.some(g => g.name === group.name)
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-black ${selectedOptionals.some(g => g.name === group.name) ? 'text-primary' : 'dark:text-white'}`}>
                            {group.name}
                          </h4>
                          {selectedOptionals.some(g => g.name === group.name) && (
                            <div className="p-1 bg-primary text-white rounded-lg">
                              <Check size={14} strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {group.items.join(' • ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Complementos Úteis 🍴</h3>
                    <p className="text-slate-500 text-sm">Perguntas automáticas que ajudam no fechamento do pedido.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMMON_COMPLEMENTS.map((comp: string) => (
                      <button
                        key={comp}
                        onClick={() => toggleComplement(comp)}
                        className={`p-4 rounded-3xl border-2 transition-all text-left group relative ${
                          selectedComplements.includes(comp)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-sm">{comp}</span>
                        {selectedComplements.includes(comp) && (
                          <div className="absolute top-2 right-2 p-1 bg-primary text-white rounded-lg scale-75">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step > 0 && (
            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button 
                onClick={() => setStep(prev => prev - 1)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-xs uppercase tracking-widest transition-all"
              >
                <ChevronLeft size={18} /> Voltar
              </button>

              <div className="flex gap-4">
                {step < 4 ? (
                  <button 
                    onClick={() => setStep(prev => prev + 1)}
                    className="px-10 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
                  >
                    Próximo Passo <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish}
                    disabled={wizardSave.isLoading}
                    className="px-10 py-3.5 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {wizardSave.isLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    Finalizar e Começar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MenuWizard;
