import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

export const productsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Priority to the context restaurant ID
    const restaurantId = ctx.restaurantId;
    
    if (!restaurantId) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*, subcategories(name)')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }),
    
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category_id: z.string(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...input, restaurant_id: restaurantId }])
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      category_id: z.string().optional(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from('products')
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
        .from('products')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),

  bulkCreate: publicProcedure
    .input(z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category_id: z.string(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    })))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const productsWithId = input.map(p => ({ ...p, restaurant_id: restaurantId }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsWithId)
        .select();
      
      if (error) throw error;
      return data;
    }),
});
