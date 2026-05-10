import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const plansRouter = router({
  list: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data;
  }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      price: z.string(),
      stripe_price_id: z.string().optional(),
      features: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('plans')
        .update({
          name: input.name,
          price: input.price,
          stripe_price_id: input.stripe_price_id,
          features: input.features,
        })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }),
});
