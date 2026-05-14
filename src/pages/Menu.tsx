import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Filter, ImageIcon, DollarSign, Tag, ListChecks, Loader2, ListFilter, X, Pencil, Trash2, Layers, ChevronDown, ChevronUp, FileUp, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { uploadImage } from '../lib/storage';
import * as XLSX from 'xlsx';

const MenuPage = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useContext();
  const { data: products, isLoading: loadingProducts } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: optionalGroups } = trpc.optionals.listGroups.useQuery();
  const { data: restaurant } = trpc.restaurants.get.useQuery();

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    subcategory_id: '',
    image_url: '',
    selectedGroups: [] as string[]
  });

  const availableSubcategories = useMemo(() => {
    if (!newProduct.category_id || !categories) return [];
    const category = categories.find(c => c.id === newProduct.category_id);
    return (category as any)?.subcategories || [];
  }, [newProduct.category_id, categories]);

  const groupedProducts = useMemo(() => {
    if (!products || !categories) return [];
    
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return categories.map(cat => ({
      ...cat,
      items: filtered.filter(p => p.categoryId === cat.id)
    })).filter(cat => cat.items.length > 0 || !searchTerm);
  }, [products, categories, searchTerm]);

  const upsertMutation = trpc.products.upsertProducts.useMutation({
    onSuccess: (res) => {
      utils.products.list.invalidate();
      toast.success(`Importação finalizada: ${res.inserted} novos e ${res.updated} atualizados.`);
      setIsImporting(false);
    },
    onError: (err) => {
      toast.error('Erro na importação: ' + err.message);
      setIsImporting(false);
    }
  });

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const amount = (parseInt(digits) / 100).toFixed(2);
    return amount.replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setNewProduct({ ...newProduct, price: formatted });
  };

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success('Produto adicionado ao cardápio!');
      closeForm();
    }
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success('Produto atualizado!');
      closeForm();
    }
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success('Produto removido');
    }
  });

  const closeForm = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setNewProduct({ name: '', description: '', price: '', category_id: '', subcategory_id: '', image_url: '', selectedGroups: [] });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: (Number(product.price) || 0).toFixed(2).replace('.', ','),
      category_id: product.categoryId,
      subcategory_id: product.subcategoryId || '',
      image_url: product.imageUrl || '',
      selectedGroups: Array.isArray(product.optionals) ? product.optionals.map((opt: any) => typeof opt === 'string' ? opt : opt.id) : []
    });
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      const url = await uploadImage(file, 'products', (percent) => {
        setUploadProgress(percent);
      });
      setNewProduct({ ...newProduct, image_url: url });
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
      return toast.error('Preencha os campos obrigatórios');
    }
    
    const productData = {
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price.replace(',', '.')),
      category_id: newProduct.category_id,
      subcategory_id: newProduct.subcategory_id || undefined,
      image_url: newProduct.image_url,
      optionals: newProduct.selectedGroups,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createMutation.mutate({ ...productData });
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Nome do Produto', 'Descricao', 'Preco', 'Categoria', 'Opcionais'],
      ['Burger Clássico', 'Pão brioche, carne 160g, queijo', '35.00', 'Burgers', ''],
      ['Coca-Cola 350ml', 'Lata gelada', '7.50', 'Bebidas', ''],
      ['Batata Frita G', 'Porção de 400g crocante', '22.00', 'Acompanhamentos', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'modelo_importacao_pedidoja.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant?.id) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error('Planilha vazia');

        const productsToImport: any[] = [];
        const missingCategories = new Set<string>();
        
        for (const row of data) {
          // Busca agressiva de colunas (ignora maiúsculas/minúsculas e espaços)
          const findValue = (possibleKeys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of rowKeys) {
              const normalizedKey = key.trim().toLowerCase();
              if (possibleKeys.some(pk => normalizedKey === pk || normalizedKey.includes(pk))) {
                return row[key];
              }
            }
            return null;
          };

          const name = findValue(['nome do produto', 'nome', 'item', 'produto']);
          const categoryName = findValue(['categoria', 'category', 'seção', 'secao', 'grupo']);
          const description = findValue(['descrição', 'descricao', 'desc', 'description']) || '';
          const priceRaw = findValue(['valor', 'preço', 'preco', 'price']);
          
          let price = 0;
          if (priceRaw !== null && priceRaw !== undefined) {
            if (typeof priceRaw === 'string') {
              // Limpeza profunda: remove tudo que não é número, ponto ou vírgula
              const cleanPrice = priceRaw.replace(/[^\d,.]/g, '').trim();
              
              if (cleanPrice.includes('.') && cleanPrice.includes(',')) {
                const lastDot = cleanPrice.lastIndexOf('.');
                const lastComma = cleanPrice.lastIndexOf(',');
                if (lastDot > lastComma) {
                  price = parseFloat(cleanPrice.replace(/,/g, '')) || 0;
                } else {
                  price = parseFloat(cleanPrice.replace(/\./g, '').replace(',', '.')) || 0;
                }
              } else if (cleanPrice.includes(',')) {
                price = parseFloat(cleanPrice.replace(',', '.')) || 0;
              } else {
                price = parseFloat(cleanPrice) || 0;
              }
            } else if (typeof priceRaw === 'number') {
              price = priceRaw;
            }
          }
          
          if (!name || !categoryName) continue;

          const category = categories?.find(c => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase());
          
          const optionalsRaw = findValue(['opcionais', 'complementos', 'adicionais', 'groups']);
          const selectedOptionals: string[] = [];
          if (optionalsRaw && optionalGroups) {
            const names = optionalsRaw.toString().split(',').map((s: string) => s.trim().toLowerCase());
            for (const optName of names) {
              const group = optionalGroups.find(g => g.name.trim().toLowerCase() === optName);
              if (group) selectedOptionals.push(group.id);
            }
          }

          if (category) {
            productsToImport.push({
              name: name.toString().trim(),
              description: description.toString().trim(),
              price,
              category_id: category.id,
              restaurant_id: restaurant.id,
              optionals: selectedOptionals
            });
          } else {
            missingCategories.add(categoryName);
          }
        }

        if (productsToImport.length > 0) {
          upsertMutation.mutate(productsToImport);
          if (missingCategories.size > 0) {
            toast.warning(`${productsToImport.length} produtos prontos, mas as categorias: ${Array.from(missingCategories).join(', ')} não foram encontradas.`);
          }
        } else {
          if (missingCategories.size > 0) {
            toast.error(`Nenhum produto importado. As categorias: ${Array.from(missingCategories).join(', ')} não foram encontradas no sistema.`);
          } else {
            toast.error('Nenhum produto válido encontrado. Verifique se os cabeçalhos da planilha estão corretos.');
          }
          setIsImporting(false);
        }
      } catch (err) {
        toast.error('Erro ao ler planilha: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
    // Limpar o input para permitir re-importar o mesmo arquivo se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleGroup = (groupId: string) => {
    setNewProduct(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategoryId(prev => prev === catId ? null : catId);
  };

  if (loadingProducts) return <div className="p-8 text-center text-slate-400">Carregando cardápio...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Cardápio</h2>
          <p className="text-slate-500 text-sm">Organize seus produtos agrupados por categoria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <Download size={18} />
            Planilha Modelo
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-5 py-3 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
            Importar Excel
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
          
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </header>

      {/* Alerta de Categorias para Importação */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 items-start">
        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          <strong>Dica para Importação:</strong> Certifique-se de que as categorias escritas na planilha (coluna "Categoria") já estejam cadastradas no sistema com o mesmo nome exato.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar produto pelo nome ou descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm dark:text-white"
          />
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || editingProduct) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-8"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold dark:text-white">{editingProduct ? `Editando: ${editingProduct.name}` : 'Adicionar Novo Item'}</h3>
              <button onClick={closeForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Foto do Produto</label>
                  <label className="aspect-square rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-all group overflow-hidden relative shadow-inner">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-4 w-full px-8">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary absolute inset-0" size={80} strokeWidth={1} />
                          <span className="text-sm font-black text-primary">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviando Arquivo...</span>
                      </div>
                    ) : newProduct.image_url ? (
                      <>
                        <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                          <ImageIcon className="text-slate-300 dark:text-slate-700" size={40} />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-slate-500 block">Clique para enviar</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">PNG, JPG ou AVIF</span>
                        </div>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <ListFilter size={16} className="text-primary" /> Opcionais Disponíveis
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {optionalGroups?.map(group => (
                      <button
                        key={group.id}
                        onClick={() => toggleGroup(group.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          newProduct.selectedGroups.includes(group.id)
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary/50'
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Ex: Burger Clássico"
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Preço de Venda (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="0,00"
                        value={newProduct.price}
                        onChange={handlePriceChange}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Descrição Detalhada</label>
                  <textarea 
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Descreva os ingredientes, tamanho, etc..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Categoria</label>
                    <select 
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value, subcategory_id: ''})}
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer dark:text-white"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {newProduct.category_id && availableSubcategories.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Subcategoria</label>
                      <select 
                        value={newProduct.subcategory_id}
                        onChange={(e) => setNewProduct({...newProduct, subcategory_id: e.target.value})}
                        className="w-full p-4 rounded-2xl border border-primary/30 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer dark:text-white"
                      >
                        <option value="">Nenhuma</option>
                        {availableSubcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={closeForm} 
                className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading || uploading}
                className="px-12 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
              >
                {(createMutation.isLoading || updateMutation.isLoading) ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Publicar no Cardápio'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {groupedProducts.map((group) => (
          <div key={group.id} className="space-y-6">
            <div 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => toggleCategoryExpand(group.id)}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-1.5 h-8 rounded-full" 
                  style={{ backgroundColor: group.color || '#F59E0B' }}
                />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  {group.name}
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {group.items.length} itens
                  </span>
                </h3>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
                {expandedCategoryId === group.id ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedCategoryId === group.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {group.items.map((product: any) => (
                      <motion.div 
                        layout
                        key={product.id} 
                        className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 relative flex flex-col h-full"
                      >
                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800">
                              <ImageIcon size={64} />
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.subcategories?.name && (
                              <div className="px-3 py-1 bg-primary/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm text-white w-fit flex items-center gap-1">
                                <Layers size={10} /> {product.subcategories.name}
                              </div>
                            )}
                          </div>

                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <button 
                              onClick={() => handleEdit(product)}
                              className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="p-7 space-y-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-xl text-slate-800 dark:text-white leading-tight group-hover:text-primary transition-colors">{product.name}</h4>
                            <div className="bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                              <span className="text-primary font-black text-lg">R$ {(Number(product.price) || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                          
                          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 flex-1">{product.description || 'Sem descrição.'}</p>
                          
                          <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-1.5">
                            {product.optionals && Array.isArray(product.optionals) && product.optionals.length > 0 ? (
                              product.optionals.map((opt: any) => {
                                const groupId = typeof opt === 'string' ? opt : opt?.id;
                                const group = optionalGroups?.find(g => g.id === groupId);
                                if (!groupId) return null;
                                return (
                                  <span key={`opt-${product.id}-${groupId}`} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400">
                                    {group?.name || 'Opcional'}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600 italic">Sem opcionais</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
