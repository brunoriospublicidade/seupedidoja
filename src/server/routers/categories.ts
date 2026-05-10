import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

export const categoriesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    // Fetch categories with their subcategories and products
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*, subcategories(*)')
      .eq('restaurant_id', restaurantId)
      .order('order', { ascending: true });
    
    if (error) throw error;

    // Fetch products to count them per category
    const { data: products } = await supabase
      .from('products')
      .select('category_id')
      .eq('restaurant_id', restaurantId);

    return categories.map(cat => ({
      ...cat,
      productCount: products?.filter(p => p.category_id === cat.id).length || 0
    }));
  }),
  
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      color: z.string(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...input, restaurant_id: restaurantId }])
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),

  createSubcategory: publicProcedure
    .input(z.object({
      category_id: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([input])
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  deleteSubcategory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),
});
