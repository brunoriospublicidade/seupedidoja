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
        customer: resCustomers.find(c => c.id === order.customerId) || null
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

          const apiUrl = restaurant.evolutionApiUrl.trim().replace(/\/+$/, '');
          const recipientRaw = restaurant.whatsapp?.replace(/\D/g, '') || '';
          const recipient = recipientRaw.startsWith('55') ? recipientRaw : `55${recipientRaw}`;

          if (recipient) {
            await fetch(`${apiUrl}/message/sendText/${restaurant.evolutionInstance.trim()}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': restaurant.evolutionApiKey.trim(),
                'accept': '*/*'
              },
              body: JSON.stringify({
                number: recipient,
                text: messageText,
                delay: 1200,
                linkPreview: false
              })
            });
          }
        } catch (error) {
          console.error('[EVOLUTION API ERROR]', error);
        }
      }

      return order;
    }),

  updateStatus: publicProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.enum(['pending', 'preparing', 'shipped', 'delivered', 'cancelled'])
    }))
    .mutation(async ({ input }) => {
      const [order] = await db.update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!order) return null;

      // Enviar notificação via WhatsApp para o cliente
      try {
        if (order.customerId && order.restaurantId) {
          const [customerData] = await db.select().from(customers).where(eq(customers.id, order.customerId));
          const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, order.restaurantId));

          if (customerData && restaurant?.evolutionApiUrl && restaurant?.evolutionApiKey && restaurant?.evolutionInstance) {
            const apiUrl = restaurant.evolutionApiUrl.trim().replace(/\/+$/, '');
            const apiKey = restaurant.evolutionApiKey.trim();
            const instance = restaurant.evolutionInstance.trim();

            let statusMsg = '';
            if (input.status === 'preparing') statusMsg = '👨‍🍳 Seu pedido está sendo preparado agora!';
            if (input.status === 'shipped') statusMsg = '🛵 Ótimas notícias! Seu pedido saiu para entrega!';
            if (input.status === 'delivered') statusMsg = '✅ Seu pedido foi entregue. Bom apetite! 🍔';
            if (input.status === 'cancelled') statusMsg = '❌ Sinto muito, seu pedido foi cancelado pelo restaurante.';

            if (statusMsg) {
              const messageText = `Olá, *${customerData.name}*!\n\n${statusMsg}\n\n*Pedido:* #${order.id.slice(-4).toUpperCase()}\n*Restaurante:* ${restaurant.name}`;

              const recipientRaw = customerData.phone.replace(/\D/g, '');
              // Garante 55 + DDD + Numero
              const recipient = recipientRaw.startsWith('55') ? recipientRaw : `55${recipientRaw}`;

              console.log('[WHATSAPP] Enviando Status para:', recipient);

              const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': apiKey,
                  'accept': '*/*'
                },
                body: JSON.stringify({
                  number: recipient,
                  options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false
                  },
                  text: messageText
                })
              });
              
              if (!response.ok) {
                const errBody = await response.text();
                console.error('[WHATSAPP ERROR RESPONSE]', errBody);
              } else {
                console.log('[WHATSAPP SUCCESS] Mensagem enviada com sucesso!');
              }
            }
          }
        }
      } catch (error) {
        console.error('[STATUS WHATSAPP ERROR]', error);
      }

      return order;
    }),
});
