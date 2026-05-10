import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const couponsRouter = router({
  list: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('restaurant_id', input.restaurantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }),

  create: publicProcedure
    .input(z.object({
      code: z.string().min(1),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().positive(),
      restaurant_id: z.string(),
      expires_at: z.string().optional().nullable(),
      usage_limit: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          ...input,
          code: input.code.toUpperCase().trim()
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  toggleStatus: publicProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({ active: input.active })
        .eq('id', input.id)
        .select();
      
      if (error) throw error;
      return data[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', input.id);
      
      if (error) throw error;
      return true;
    }),

  validate: publicProcedure
    .input(z.object({ 
      code: z.string(), 
      restaurantId: z.string() 
    }))
    .mutation(async ({ input }) => {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', input.code.toUpperCase().trim())
        .eq('restaurant_id', input.restaurantId)
        .eq('active', true)
        .single();

      if (error || !coupon) return { valid: false, message: 'Cupom inválido ou expirado' };

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return { valid: false, message: 'Este cupom atingiu o limite de uso' };
      }

      // Check expiration date
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, message: 'Este cupom expirou' };
      }

      return { valid: true, coupon };
    }),
});
