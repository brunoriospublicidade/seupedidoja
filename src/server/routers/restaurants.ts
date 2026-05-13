import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { restaurants, categories, products, optionalGroups, optionalItems, settings, orders } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const restaurantsRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const targetId = input?.id || ctx.restaurantId;
      
      if (!targetId) {
        const [data] = await db.select().from(restaurants).limit(1);
        return data;
      }
      
      const [data] = await db.select().from(restaurants).where(eq(restaurants.id, targetId));
      
      // Auto-promoção para o dono da plataforma
      if (data && data.email === 'brunoriospublicidade@gmail.com' && data.role !== 'admin') {
        data.role = 'admin';
        // Opcional: Atualizar no banco de forma assíncrona
        db.update(restaurants).set({ role: 'admin' }).where(eq(restaurants.id, data.id)).execute().catch(console.error);
      }

      return data;
    }),

  listAll: publicProcedure
    .query(async () => {
      return await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;
      
      // Busca por email ou telefone
      const [restaurant] = await db.select()
        .from(restaurants)
        .where(sql`${restaurants.email} = ${email} OR ${restaurants.phone} = ${email}`);

      if (!restaurant) {
        throw new Error('Credenciais inválidas');
      }

      // Se não tiver senha (legado), tenta o match pelo description ou se a senha for vazia
      if (!restaurant.password) {
        const phoneMatch = restaurant.phone?.replace(/\D/g, '') === email.replace(/\D/g, '');
        const isLegacyMatch = restaurant.description?.toLowerCase().includes(`email: ${email.toLowerCase()}`) || phoneMatch;
        
        if (isLegacyMatch) {
          return {
            id: restaurant.id,
            name: restaurant.name,
            role: restaurant.role
          };
        }
        throw new Error('Credenciais inválidas');
      }

      const isPasswordValid = await bcrypt.compare(password, restaurant.password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        role: restaurant.role
      };
    }),

  getPlatformStats: publicProcedure
    .query(async () => {
      const data = await db.select().from(restaurants);
      
      const stats = {
        totalRestaurants: data.length,
        paidSubscriptions: data.filter(r => ['prata', 'gold'].includes(r.subscriptionPlan || '')).length,
        trialSubscriptions: data.filter(r => r.subscriptionPlan === 'bronze' || !r.subscriptionPlan).length,
        mrr: data.reduce((acc, r) => {
          if (r.subscriptionPlan === 'prata') return acc + 29.90;
          if (r.subscriptionPlan === 'gold') return acc + 49.90;
          if (r.subscriptionPlan === 'bronze') return acc + 9.90;
          return acc;
        }, 0),
        nicheDistribution: data.reduce((acc: any, r) => {
          const niche = r.foodType || 'Outros';
          acc[niche] = (acc[niche] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(restaurants).where(eq(restaurants.id, input.id));
      return { success: true };
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      food_type: z.string().optional(),
      address: z.string().optional(),
      cep: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. Check if restaurant with same phone already exists
      const [existing] = await db.select().from(restaurants).where(eq(restaurants.phone, input.phone));

      if (existing) {
        throw new Error('Já existe um cadastro com este telefone. Por favor, faça login.');
      }

      const slug = generateSlug(input.name);
      
      const [data] = await db.insert(restaurants).values({
        name: input.name,
        email: input.email,
        ownerId: 'a146223e-5e54-433c-b8eb-edb8938f813c', 
        phone: input.phone,
        whatsapp: input.phone,
        foodType: input.food_type,
        address: input.address,
        cep: input.cep,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        description: `Email: ${input.email}`,
        slug,
        subscriptionPlan: 'bronze',
        primaryColor: '#F59E0B',
        themePreference: 'light',
        password: input.password ? await bcrypt.hash(input.password, 10) : null
      }).returning();

      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      food_type: z.string().optional(),
      slug: z.string().optional(),
      logo_url: z.string().optional(),
      banner_url: z.string().optional(),
      primary_color: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      address: z.string().optional(),
      cep: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      opening_hours: z.any().optional(),
      subscription_plan: z.string().optional(),
      theme_preference: z.enum(['light', 'dark']).optional(),
      evolution_api_url: z.string().optional(),
      evolution_api_key: z.string().optional(),
      evolution_instance: z.string().optional(),
      role: z.string().optional(),
      delivery_config: z.any().optional(),
      email: z.string().optional(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const targetId = id || ctx.restaurantId;

      if (!targetId) throw new Error('Restaurant ID not found');

      const mappedData: any = {};
      if (input.name !== undefined) {
        mappedData.name = input.name;
        if (!input.slug) mappedData.slug = generateSlug(input.name);
      }
      if (input.description !== undefined) mappedData.description = input.description;
      if (input.food_type !== undefined) mappedData.foodType = input.food_type;
      if (input.slug !== undefined) mappedData.slug = input.slug;
      if (input.logo_url !== undefined) mappedData.logoUrl = input.logo_url;
      if (input.banner_url !== undefined) mappedData.bannerUrl = input.banner_url;
      if (input.primary_color !== undefined) mappedData.primaryColor = input.primary_color;
      if (input.phone !== undefined) mappedData.phone = input.phone;
      if (input.whatsapp !== undefined) mappedData.whatsapp = input.whatsapp;
      if (input.address !== undefined) mappedData.address = input.address;
      if (input.cep !== undefined) mappedData.cep = input.cep;
      if (input.complement !== undefined) mappedData.complement = input.complement;
      if (input.neighborhood !== undefined) mappedData.neighborhood = input.neighborhood;
      if (input.city !== undefined) mappedData.city = input.city;
      if (input.state !== undefined) mappedData.state = input.state;
      if (input.opening_hours !== undefined) mappedData.openingHours = input.opening_hours;
      if (input.subscription_plan !== undefined) mappedData.subscriptionPlan = input.subscription_plan;
      if (input.theme_preference !== undefined) mappedData.themePreference = input.theme_preference;
      if (input.evolution_api_url !== undefined) mappedData.evolutionApiUrl = input.evolution_api_url;
      if (input.evolution_api_key !== undefined) mappedData.evolutionApiKey = input.evolution_api_key;
      if (input.evolution_instance !== undefined) mappedData.evolutionInstance = input.evolution_instance;
      if (input.role !== undefined) mappedData.role = input.role;
      if (input.delivery_config !== undefined) mappedData.deliveryConfig = input.delivery_config;
      if (input.email !== undefined) mappedData.email = input.email;
      if (input.password !== undefined) mappedData.password = input.password;
      
      console.log('[UPDATE DEBUG] Restaurant ID:', targetId);
      console.log('[UPDATE DEBUG] Mapped Data:', mappedData);

      const [data] = await db.update(restaurants)
        .set(mappedData)
        .where(eq(restaurants.id, targetId))
        .returning();
      
      return data;
    }),

  getPublicMenu: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // 1. Get restaurant
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.slug, input.slug));
      if (!restaurant) throw new Error('Restaurante não encontrado');

      // 2. Get categories
      const resCategories = await db.select().from(categories)
        .where(eq(categories.restaurantId, restaurant.id))
        .orderBy(categories.order);

      // 3. Get products
      const resProducts = await db.select().from(products).where(eq(products.restaurantId, restaurant.id));

      // 4. Get optional groups
      const resOptionalGroups = await db.select().from(optionalGroups).where(eq(optionalGroups.restaurantId, restaurant.id));
      
      // 5. Get optional items for these groups
      // For simplicity in MVP, we can map them or do another query
      const resOptionalItems = await db.select().from(optionalItems);

      return {
        restaurant,
        categories: resCategories || [],
        products: resProducts || [],
        optionalGroups: resOptionalGroups.map(group => ({
          ...group,
          optional_items: resOptionalItems.filter(item => item.groupId === group.id)
        })) || [],
      };
    }),

  
  updateWhatsAppSettings: publicProcedure
    .input(z.object({
      evolution_url: z.string(),
      evolution_key: z.string(),
      evolution_instance: z.string()
    }))
    .mutation(async ({ input }) => {
      await db.insert(settings)
        .values({
          key: 'marketing_config',
          value: input,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: input, updatedAt: new Date() }
        });
      
      return { success: true };
    }),

  getEvolutionSettings: publicProcedure
    .query(async ({ ctx }) => {
      // 1. Buscar configurações globais
      const [configRow] = await db.select().from(settings).where(eq(settings.key, 'marketing_config'));
      const config = (configRow?.value as any) || {};

      return {
        ctxId: ctx.restaurantId || 'NÃO RECEBIDO',
        hasUrl: !!config.evolution_url,
        hasKey: !!config.evolution_key,
        hasInstance: !!config.evolution_instance,
        apiUrl: config.evolution_url,
        instance: config.evolution_instance,
        isGlobal: true,
        rawData: JSON.stringify(config)
      };
    }),

  testWhatsApp: publicProcedure
    .input(z.object({
      phone: z.string()
    }))
    .mutation(async ({ input }) => {
      // 1. Buscar configurações globais
      const [configRow] = await db.select().from(settings).where(eq(settings.key, 'marketing_config'));
      const config = (configRow?.value as any) || {};

      const apiUrl = config.evolution_url?.replace(/\/$/, '').trim();
      const apiKey = config.evolution_key?.trim();
      const instance = config.evolution_instance?.trim();

      if (!apiUrl || !apiKey || !instance) {
        throw new Error('Configurações globais da Evolution API não encontradas.');
      }

      const recipientRaw = input.phone.replace(/\D/g, '');
      const recipient = recipientRaw.startsWith('55') ? recipientRaw : `55${recipientRaw}`;

      console.log('[WHATSAPP TEST GLOBAL] Enviando para:', recipient);

      try {
        const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'accept': '*/*'
          },
          body: JSON.stringify({
            number: recipient,
            textMessage: {
              text: `🚀 *TESTE DE CONEXÃO GLOBAL*\n\nSeu sistema está conectado corretamente à Evolution API!\n\n*Status:* Operacional\n*Data:* ${new Date().toLocaleString('pt-BR')}`
            },
            options: { delay: 1200, presence: 'composing', linkPreview: false }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          return { success: false, error: errBody };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),
  
  getDetailedAnalytics: publicProcedure
    .query(async () => {
      const allRestaurants = await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
      
      const analytics = await Promise.all(allRestaurants.map(async (rest) => {
        const [productsCountRow] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.restaurantId, rest.id));
        const [ordersCountRow] = await db.select({ 
          count: sql<number>`count(*)`,
          revenue: sql<number>`sum(total)`
        }).from(orders).where(eq(orders.restaurantId, rest.id));
        
        const [lastOrderRow] = await db.select({ date: orders.createdAt })
          .from(orders)
          .where(eq(orders.restaurantId, rest.id))
          .orderBy(desc(orders.createdAt))
          .limit(1);

        return {
          id: rest.id,
          name: rest.name,
          email: rest.email,
          foodType: rest.foodType,
          subscriptionPlan: rest.subscriptionPlan,
          productsCount: Number(productsCountRow?.count || 0),
          ordersCount: Number(ordersCountRow?.count || 0),
          totalRevenue: Number(ordersCountRow?.revenue || 0),
          lastOrderAt: lastOrderRow?.date || null,
          createdAt: rest.createdAt
        };
      }));

      return analytics;
    }),
});
