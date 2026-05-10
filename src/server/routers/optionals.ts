import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

export const optionalsRouter = router({
  listGroups: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    const { data, error } = await supabase
      .from('optional_groups')
      .select('*, optional_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }),
  
  createGroup: publicProcedure
    .input(z.object({
      name: z.string(),
      is_mandatory: z.boolean().optional(),
      max_selection: z.number().optional(),
      items: z.array(z.object({
        name: z.string(),
        price: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const { items, ...groupData } = input;
      
      const { data: group, error: groupError } = await supabase
        .from('optional_groups')
        .insert([{ ...groupData, restaurant_id: restaurantId }])
        .select()
        .single();
      
      if (groupError) throw groupError;

      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          group_id: group.id,
        }));
        
        const { error: itemsError } = await supabase
          .from('optional_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }

      return group;
    }),

  updateGroup: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      is_mandatory: z.boolean().optional(),
      max_selection: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from('optional_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }),

  deleteGroup: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('optional_groups')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),

  createItem: publicProcedure
    .input(z.object({
      name: z.string(),
      price: z.number(),
      group_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('optional_items')
        .insert([input])
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  updateItem: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      price: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from('optional_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }),

  deleteItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('optional_items')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),
});
