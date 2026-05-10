import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const ordersRouter = router({
  list: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      return data;
    }),

  getStats: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at');

      if (error) return { totalRevenue: 0, totalOrders: 0 };

      const totalRevenue = data.reduce((sum, order) => sum + Number(order.total), 0);
      return {
        totalRevenue,
        totalOrders: data.length,
        data
      };
    }),
});
