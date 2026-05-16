export interface WizardCategory {
  name: string;
  selected: boolean;
}

export interface WizardProduct {
  name: string;
  selected: boolean;
}

export interface WizardOptionalGroup {
  name: string;
  items: string[];
  selected: boolean;
}

export interface WizardSegmentData {
  categories: string[];
  products: string[];
  optionals: { name: string; items: string[] }[];
}

export const WIZARD_DATA: Record<string, WizardSegmentData> = {
  "Hamburgueria": {
    categories: ["Burgers", "Smash Burgers", "Combos", "Batatas", "Onion Rings", "Adicionais", "Molhos", "Bebidas", "Sobremesas"],
    products: ["Smash Burger", "Bacon Burger", "Double Cheddar", "X-Tudo", "Chicken Crispy", "Classic Burger", "Onion Bacon", "Salad Burger", "Monster Burger", "BBQ Burger", "Costela Burger", "Veggie Burger", "Burger Artesanal", "Combo Smash", "Combo Bacon"],
    optionals: [
      { name: "Ponto da carne", items: ["Mal passado", "Ao ponto", "Bem passado"] },
      { name: "Extras", items: ["Bacon", "Cheddar extra", "Hambúrguer extra", "Ovo", "Onion Rings", "Catupiry", "Picles", "Jalapeño"] },
      { name: "Remover ingredientes", items: ["Sem cebola", "Sem tomate", "Sem alface", "Sem picles"] },
      { name: "Combos", items: ["Adicionar batata", "Adicionar refrigerante", "Combo completo"] },
      { name: "Molhos", items: ["Maionese da casa", "Barbecue", "Ketchup", "Mostarda", "Molho verde"] }
    ]
  },
  "Pizzaria": {
    categories: ["Pizzas Tradicionais", "Pizzas Especiais", "Pizzas Doces", "Meio a Meio", "Bordas Recheadas", "Esfihas", "Bebidas", "Sobremesas"],
    products: ["Calabresa", "Portuguesa", "Frango com Catupiry", "Marguerita", "Quatro Queijos", "Bacon Supreme", "Pepperoni", "Moda da Casa", "Napolitana", "Toscana", "Chocolate com Morango", "Romeu e Julieta", "Pizza Especial da Casa", "Pizza Meio a Meio", "Pizza Família"],
    optionals: [
      { name: "Tamanho", items: ["Pequena", "Média", "Grande", "Família"] },
      { name: "Tipo de massa", items: ["Tradicional", "Fina", "Pan", "Integral"] },
      { name: "Borda recheada", items: ["Catupiry", "Cheddar", "Chocolate", "Sem borda"] },
      { name: "Adicionais", items: ["Queijo extra", "Bacon", "Calabresa extra", "Azeitona", "Orégano extra"] },
      { name: "Corte", items: ["4 pedaços", "6 pedaços", "8 pedaços"] }
    ]
  },
  "Sushi": {
    categories: ["Combinados", "Hot Rolls", "Sushis", "Sashimis", "Temakis", "Yakisoba", "Entradas", "Molhos e Extras", "Bebidas", "Sobremesas"],
    products: ["Combo 20 Peças", "Combo 40 Peças", "Hot Roll", "Temaki Salmão", "Temaki Philadelphia", "Yakisoba de Frango", "Yakisoba Misto", "Sashimi de Salmão", "Uramaki Filadélfia", "Hossomaki", "Gunkan", "Joy Salmão", "Poke Salmão", "Poke Atum", "Combo Premium"],
    optionals: [
      { name: "Molhos", items: ["Shoyu", "Tarê", "Molho agridoce", "Molho picante"] },
      { name: "Acompanhamentos", items: ["Hashi", "Gengibre", "Wasabi"] },
      { name: "Adicionais", items: ["Cream cheese extra", "Salmão extra", "Cebolinha", "Crispy"] },
      { name: "Temaki", items: ["Sem arroz", "Dobro de salmão", "Extra cream cheese"] }
    ]
  },
  "Açaí": {
    categories: ["Açaí Tradicional", "Monte Seu Açaí", "Combinações", "Cremes", "Milkshakes", "Frutas", "Adicionais", "Bebidas"],
    products: ["Açaí 300ml", "Açaí 500ml", "Açaí 700ml", "Copo Supremo", "Barca de Açaí", "Açaí Tradicional", "Açaí com Nutella", "Açaí com Morango", "Açaí Kids", "Milkshake de Açaí", "Açaí Power", "Açaí Tropical", "Combo Açaí", "Creme de Cupuaçu", "Mix de Cremes"],
    optionals: [
      { name: "Tamanho", items: ["300ml", "500ml", "700ml", "1L"] },
      { name: "Frutas", items: ["Banana", "Morango", "Kiwi", "Manga", "Uva"] },
      { name: "Cremes", items: ["Nutella", "Paçoca", "Leite condensado", "Creme de ninho", "Doce de leite"] },
      { name: "Crocantes", items: ["Granola", "Castanha", "Chocoball", "Sucrilhos", "Amendoim"] },
      { name: "Extras", items: ["Whey protein", "Mel", "Chantilly"] }
    ]
  },
  "Marmitas": {
    categories: ["Marmitas Pequenas", "Marmitas Médias", "Marmitas Grandes", "Pratos Executivos", "Fitness", "Vegetariano", "Adicionais", "Bebidas", "Sobremesas"],
    products: ["Marmita Executiva", "Marmita Pequena", "Marmita Média", "Marmita Grande", "Frango Grelhado", "Bife Acebolado", "Strogonoff de Frango", "Feijoada Completa", "Marmita Fitness", "Tilápia Grelhada", "Parmegiana", "Costelinha BBQ", "Marmita Vegetariana", "Prato Feito Tradicional", "Combo Família"],
    optionals: [
      { name: "Proteína", items: ["Frango", "Carne bovina", "Peixe", "Linguiça", "Ovo"] },
      { name: "Acompanhamentos", items: ["Batata frita", "Purê", "Farofa", "Salada", "Legumes"] },
      { name: "Tipo de arroz", items: ["Branco", "Integral"] },
      { name: "Feijão", items: ["Carioca", "Preto", "Sem feijão"] },
      { name: "Extras", items: ["Ovo frito", "Vinagrete", "Molho especial"] },
      { name: "Utilidades", items: ["Talher", "Guardanapo"] }
    ]
  },
  "Lanches": {
    categories: ["Lanches Tradicionais", "Lanches Especiais", "Cachorro-Quente", "Combos", "Porções", "Molhos", "Bebidas", "Sobremesas"],
    products: ["Cachorro-Quente Tradicional", "Cachorro-Quente Duplo", "X-Salada", "X-Bacon", "X-Egg", "X-Tudo", "Americano", "Misto Quente", "Bauru", "Cheese Salad", "Cheese Bacon", "Lanche Especial", "Combo Fast", "Batata Suprema", "Hot Dog Especial"],
    optionals: [
      { name: "Extras", items: ["Bacon", "Queijo extra", "Ovo", "Batata palha", "Milho", "Catupiry"] },
      { name: "Remover ingredientes", items: ["Sem cebola", "Sem milho", "Sem ervilha", "Sem molho"] },
      { name: "Combo", items: ["Refrigerante", "Batata frita", "Combo completo"] },
      { name: "Molhos", items: ["Ketchup", "Mostarda", "Maiese", "Molho verde"] }
    ]
  },
  "Churrascaria / Espetinho": {
    categories: ["Espetinhos", "Porções", "Carnes", "Acompanhamentos", "Marmitas", "Molhos", "Bebidas", "Sobremesas"],
    products: ["Espetinho de Carne", "Espetinho de Frango", "Espetinho Misto", "Kafta", "Coração de Frango", "Picanha na Chapa", "Costela BBQ", "Linguiça Artesanal", "Porção Mista", "Frango com Bacon", "Espeto Premium", "Combo Churrasco", "Medalhão de Frango", "Panceta Crocante", "Parrilla Especial"],
    optionals: [
      { name: "Ponto da carne", items: ["Mal passado", "Ao ponto", "Bem passado"] },
      { name: "Acompanhamentos", items: ["Farofa", "Vinagrete", "Arroz", "Batata frita"] },
      { name: "Molhos", items: ["Chimichurri", "Alho", "Barbecue", "Pimenta"] },
      { name: "Extras", items: ["Queijo coalho", "Bacon", "Linguiça"] }
    ]
  },
  "Doceria": {
    categories: ["Bolos", "Fatias", "Tortas", "Brigadeiros", "Doces Gourmet", "Combos", "Cafés", "Bebidas", "Datas Especiais"],
    products: ["Brownie com Nutella", "Brigadeiro Gourmet", "Beijinho Gourmet", "Cheesecake", "Donut Recheado", "Fatia de Bolo", "Bolo no Pote", "Cookie Artesanal", "Torta de Limão", "Red Velvet", "Banoffee", "Churros Gourmet", "Copo da Felicidade", "Petit Gateau", "Combo Doces"],
    optionals: [
      { name: "Coberturas", items: ["Nutella", "Brigadeiro", "Morango", "Caramelo"] },
      { name: "Adicionais", items: ["Sorvete", "Chantilly", "Granulado", "Leite condensado"] },
      { name: "Tamanho", items: ["Pequeno", "Médio", "Grande"] }
    ]
  },
  "Cafeteria": {
    categories: ["Cafés", "Cafés Gelados", "Cappuccinos", "Salgados", "Sanduíches", "Doces", "Combos", "Bebidas"],
    products: ["Espresso", "Café Coado", "Cappuccino Cremoso", "Cappuccino Gelado", "Mocha", "Latte", "Chocolate Quente", "Croissant", "Pão de Queijo", "Sanduíche Natural", "Toast Especial", "Café Gourmet", "Frappuccino", "Combo Café da Manhã", "Brownie com Café"],
    optionals: [
      { name: "Tamanho", items: ["Pequeno", "Médio", "Grande"] },
      { name: "Tipo de leite", items: ["Integral", "Desnatado", "Sem lactose", "Vegetal"] },
      { name: "Extras", items: ["Chantilly", "Canela", "Chocolate extra", "Espresso extra"] },
      { name: "Açúcar", items: ["Açúcar", "Adoçante", "Sem açúcar"] }
    ]
  },
  "Pastelaria": {
    categories: ["Pastéis Tradicionais", "Pastéis Especiais", "Pastéis Doces", "Combos", "Porções", "Caldos", "Bebidas"],
    products: ["Pastel de Carne", "Pastel de Queijo", "Pastel de Frango", "Pastel Especial", "Pastel de Pizza", "Pastel de Chocolate", "Pastel Romeu e Julieta", "Combo Pastel", "Mini Pastéis", "Pastelão da Casa", "Pastel de Calabresa", "Pastel de Camarão", "Pastel Gourmet", "Pastel Supremo", "Pastel Família"],
    optionals: [
      { name: "Tamanho", items: ["Tradicional", "Grande"] },
      { name: "Adicionais", items: ["Queijo extra", "Catupiry", "Bacon", "Milho"] },
      { name: "Molhos", items: ["Vinagrete", "Molho da casa", "Pimenta"] }
    ]
  },
  "Restaurante": {
    categories: ["Pratos Executivos", "Grelhados", "Massas", "Saladas", "Guarnições", "Bebidas", "Sobremesas"],
    products: ["Prato Feito", "Bife a Cavalo", "Frango com Fritas", "Lasanha Bolonhesa", "Salada Caesar", "Filé de Peixe"],
    optionals: [
      { name: "Ponto da carne", items: ["Mal passado", "Ao ponto", "Bem passado"] },
      { name: "Acompanhamentos", items: ["Arroz", "Feijão", "Fritas", "Purê"] }
    ]
  }
};

export const COMMON_COMPLEMENTS = [
  "Precisa de talher?",
  "Precisa de guardanapo?",
  "Enviar ketchup?",
  "Enviar maiese?",
  "Enviar canudo?"
];
