import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { customers, orders } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const customersRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) return [];

      return await db.select().from(customers)
        .where(eq(customers.restaurantId, restaurantId))
        .orderBy(desc(customers.createdAt));
    }),

  getDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [customer] = await db.select().from(customers).where(eq(customers.id, input.id));
      
      const resOrders = await db.select().from(orders)
        .where(eq(orders.customerId, input.id))
        .orderBy(desc(orders.createdAt));

      return {
        ...customer,
        orders: resOrders
      };
    }),
});
