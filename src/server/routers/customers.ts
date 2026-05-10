import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const customersRouter = router({
  list: publicProcedure
    .query(async () => {
      // Since we might not have a direct customers table, we could derive them from orders
      // but the goal is to have a dedicated customers table.
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
      return data;
    }),

  getDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', input.id)
        .single();

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', input.id)
        .order('created_at', { ascending: false });

      return {
        ...customer,
        orders
      };
    }),
});
