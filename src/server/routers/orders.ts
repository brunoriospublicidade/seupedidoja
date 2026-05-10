import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { orders, customers } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const ordersRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) return [];

      const resOrders = await db.select().from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.createdAt));
      
      const resCustomers = await db.select().from(customers);

      return resOrders.map(order => ({
        ...order,
        customers: resCustomers.find(c => c.id === order.customerId) || null
      }));
    }),

  getStats: publicProcedure
    .query(async ({ ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) return { totalRevenue: 0, totalOrders: 0, data: [] };

      const data = await db.select().from(orders)
        .where(eq(orders.restaurantId, restaurantId));

      const totalRevenue = data.reduce((sum, order) => sum + Number(order.total), 0);
      return {
        totalRevenue,
        totalOrders: data.length,
        data
      };
    }),
});
