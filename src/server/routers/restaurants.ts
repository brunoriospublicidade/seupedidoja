import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { restaurants, categories, products, optionalGroups, optionalItems } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

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
      return data;
    }),

  listAll: publicProcedure
    .query(async () => {
      return await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
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
        themePreference: 'light'
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
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const targetId = id || ctx.restaurantId;

      if (!targetId) throw new Error('Restaurant ID not found');

      const mappedData: any = {};
      if (input.name) {
        mappedData.name = input.name;
        if (!input.slug) mappedData.slug = generateSlug(input.name);
      }
      if (input.description) mappedData.description = input.description;
      if (input.food_type) mappedData.foodType = input.food_type;
      if (input.slug) mappedData.slug = input.slug;
      if (input.logo_url) mappedData.logoUrl = input.logo_url;
      if (input.banner_url) mappedData.bannerUrl = input.banner_url;
      if (input.primary_color) mappedData.primaryColor = input.primary_color;
      if (input.phone) mappedData.phone = input.phone;
      if (input.whatsapp) mappedData.whatsapp = input.whatsapp;
      if (input.address) mappedData.address = input.address;
      if (input.cep) mappedData.cep = input.cep;
      if (input.complement) mappedData.complement = input.complement;
      if (input.neighborhood) mappedData.neighborhood = input.neighborhood;
      if (input.city) mappedData.city = input.city;
      if (input.state) mappedData.state = input.state;
      if (input.opening_hours) mappedData.openingHours = input.opening_hours;
      if (input.subscription_plan) mappedData.subscriptionPlan = input.subscription_plan;
      if (input.theme_preference) mappedData.themePreference = input.theme_preference;
      if (input.evolution_api_url !== undefined) mappedData.evolutionApiUrl = input.evolution_api_url;
      if (input.evolution_api_key !== undefined) mappedData.evolutionApiKey = input.evolution_api_key;
      if (input.evolution_instance !== undefined) mappedData.evolutionInstance = input.evolution_instance;

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
});
