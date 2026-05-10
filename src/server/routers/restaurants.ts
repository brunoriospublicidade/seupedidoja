import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

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
        // Legacy fallback: if absolutely no ID, get the first one (not ideal for multi-tenant)
        const { data, error } = await supabase.from('restaurants').select('*').limit(1).single();
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (error) throw error;
      return data;
    }),

  listAll: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }),

  getPlatformStats: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('subscription_plan, food_type, created_at');
      
      if (error) throw error;

      const stats = {
        totalRestaurants: data.length,
        paidSubscriptions: data.filter(r => ['prata', 'gold'].includes(r.subscription_plan)).length,
        trialSubscriptions: data.filter(r => r.subscription_plan === 'bronze' || !r.subscription_plan).length,
        mrr: data.reduce((acc, r) => {
          if (r.subscription_plan === 'prata') return acc + 29.90;
          if (r.subscription_plan === 'gold') return acc + 49.90;
          if (r.subscription_plan === 'bronze') return acc + 9.90;
          return acc;
        }, 0),
        nicheDistribution: data.reduce((acc: any, r) => {
          const niche = r.food_type || 'Outros';
          acc[niche] = (acc[niche] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return { success: true };
    }),


  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      food_type: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. Check if restaurant with same phone already exists
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('phone', input.phone)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe um cadastro com este telefone. Por favor, faça login.');
      }

      const slug = generateSlug(input.name);
      
      const { data, error } = await supabase
        .from('restaurants')
        .insert([{
          name: input.name,
          owner_id: 'a146223e-5e54-433c-b8eb-edb8938f813c', // Use a valid existing owner ID for demo
          phone: input.phone,
          whatsapp: input.phone, // Populate whatsapp with phone as default
          food_type: input.food_type,
          address: input.address,
          description: `Email: ${input.email}`, // Store email in description as a workaround
          slug,
          subscription_plan: 'bronze', // Default plan
          primary_color: '#F59E0B',
          theme_preference: 'light'
        }])
        .select()
        .single();

      if (error) throw error;
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
      opening_hours: z.any().optional(),
      subscription_plan: z.string().optional(),
      theme_preference: z.enum(['light', 'dark']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const targetId = id || ctx.restaurantId;

      if (!targetId) throw new Error('Restaurant ID not found');

      // Auto-generate slug if name changed and slug not provided
      if (input.name && !input.slug) {
        updateData.slug = generateSlug(input.name);
      }

      const { data, error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', targetId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }),

  getPublicMenu: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // 1. Get restaurant
      const { data: restaurant, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', input.slug)
        .single();
      
      if (resError) throw resError;

      // 2. Get categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order', { ascending: true });

      // 3. Get products with items
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      // 4. Get optional groups
      const { data: optionalGroups } = await supabase
        .from('optional_groups')
        .select('*, optional_items(*)')
        .eq('restaurant_id', restaurant.id);

      return {
        restaurant,
        categories: categories || [],
        products: products || [],
        optionalGroups: optionalGroups || [],
      };
    }),
});
