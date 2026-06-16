import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { customers, orders } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const customersRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) return [];

      const data = await db.select({
        id: customers.id,
        restaurantId: customers.restaurantId,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        neighborhood: customers.neighborhood,
        createdAt: customers.createdAt,
        total_orders: sql<number>`count(${orders.id})`,
        total_spent: sql<string>`coalesce(sum(${orders.total}), '0')`,
        last_order: sql<string>`max(${orders.createdAt})`
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(eq(customers.restaurantId, restaurantId))
      .groupBy(customers.id)
      .orderBy(desc(customers.createdAt));

      return data.map(c => ({
        ...c,
        status: Number(c.total_orders) >= 5 ? 'Fiel' : 'Ativo'
      }));
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
