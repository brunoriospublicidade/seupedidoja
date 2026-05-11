import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { orders, customers, restaurants } from '../db/schema';
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
  create: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      items: z.array(z.any()),
      total: z.number(),
      customer: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string().optional(),
      })
    }))
    .mutation(async ({ input }) => {
      // 1. Create or find customer
      const [customer] = await db.insert(customers).values({
        restaurantId: input.restaurantId,
        name: input.customer.name,
        phone: input.customer.phone,
        address: input.customer.address,
      }).returning();

      // 2. Create order
      const [order] = await db.insert(orders).values({
        restaurantId: input.restaurantId,
        customerId: customer.id,
        items: input.items,
        total: input.total.toString(),
        status: 'pending'
      }).returning();

      // 3. Get restaurant settings for Evolution API
      const [restaurant] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId));

      // 4. Send WhatsApp via Evolution API if configured
      if (restaurant?.evolutionApiUrl && restaurant?.evolutionApiKey && restaurant?.evolutionInstance) {
        try {
          const messageText = `*Novo Pedido Recebido!* 🍔\n\n` +
            `*Cliente:* ${input.customer.name}\n` +
            `*Telefone:* ${input.customer.phone}\n` +
            `*Endereço:* ${input.customer.address || 'Não informado'}\n\n` +
            `*Itens:* \n${input.items.map((i: any) => `- ${i.quantity}x ${i.name} (R$ ${i.price})`).join('\n')}\n\n` +
            `*Total:* R$ ${input.total.toFixed(2)}`;

          await fetch(`${restaurant.evolutionApiUrl}/message/sendText/${restaurant.evolutionInstance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': restaurant.evolutionApiKey
            },
            body: JSON.stringify({
              number: restaurant.whatsapp?.replace(/\D/g, ''),
              text: messageText,
              delay: 1200
            })
          });
        } catch (error) {
          console.error('[EVOLUTION API ERROR]', error);
        }
      }

      return order;
    }),
});
