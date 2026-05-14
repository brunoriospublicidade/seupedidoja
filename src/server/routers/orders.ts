import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { orders, customers, restaurants, settings, coupons } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [order] = await db.select().from(orders)
        .where(eq(orders.id, input.id));
      
      if (!order) return null;

      const customer = order.customerId 
        ? await db.select().from(customers).where(eq(customers.id, order.customerId)).then(res => res[0])
        : null;

      const restaurant = order.restaurantId 
        ? await db.select().from(restaurants).where(eq(restaurants.id, order.restaurantId)).then(res => res[0])
        : null;

      return {
        ...order,
        customer,
        restaurant
      };
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
      couponId: z.string().optional(),
      customerId: z.string().optional(),
      customer: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
      })
    }))
    .mutation(async ({ input }) => {
      console.log('[ORDER ATTEMPT] Input:', JSON.stringify(input, null, 2));
      try {
        let customerId = input.customerId;

        // 1. Create or find customer if not provided
        if (!customerId) {
          // Tentar encontrar por telefone e restaurante primeiro
          const [existingCustomer] = await db.select()
            .from(customers)
            .where(sql`${customers.phone} = ${input.customer.phone} AND ${customers.restaurantId} = ${input.restaurantId}`);
          
          if (existingCustomer) {
            customerId = existingCustomer.id;
            // Opcional: Atualizar nome se mudou
            if (existingCustomer.name !== input.customer.name) {
              await db.update(customers)
                .set({ name: input.customer.name })
                .where(eq(customers.id, customerId));
            }
          } else {
            const [newCustomer] = await db.insert(customers).values({
              restaurantId: input.restaurantId,
              name: input.customer.name,
              phone: input.customer.phone,
            }).returning();
            
            if (!newCustomer) throw new Error('Falha ao criar novo cliente.');
            customerId = newCustomer.id;
          }
        }

        // 2. Handle Coupon usage
        if (input.couponId) {
          try {
            const [coupon] = await db.select().from(coupons).where(eq(coupons.id, input.couponId));
            if (coupon && coupon.active) {
              await db.update(coupons)
                .set({ usageCount: (coupon.usageCount || 0) + 1 })
                .where(eq(coupons.id, coupon.id));
            }
          } catch (couponErr) {
            console.error('[COUPON ERROR]', couponErr);
            // Don't fail the whole order for a coupon update error
          }
        }

        // 3. Create order
        const [order] = await db.insert(orders).values({
          restaurantId: input.restaurantId,
          customerId: customerId,
          items: input.items,
          total: input.total.toString(),
          address: input.customer.address,
          neighborhood: input.customer.neighborhood,
          status: 'pending'
        }).returning();

        if (!order) throw new Error('Falha ao gerar registro do pedido no banco.');

        // 4. Notificar o RESTAURANTE
        try {
          const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, input.restaurantId));
          const [configRow] = await db.select().from(settings).where(eq(settings.key, 'marketing_config'));
          const config = (configRow?.value as any) || {};

          const apiUrl = config.evolution_url?.replace(/\/$/, '').trim();
          const apiKey = config.evolution_key?.trim();
          const instance = config.evolution_instance?.trim();

          if (apiUrl && apiKey && instance && restaurant?.whatsapp) {
            const messageText = `🔔 *NOVO PEDIDO RECEBIDO!* (#${order.id.slice(-4).toUpperCase()})\n\n` +
              `*Cliente:* ${input.customer.name}\n` +
              `*Valor:* R$ ${input.total.toFixed(2)}\n\n` +
              `Acesse o painel para gerenciar o pedido.`;

            const recipientRaw = restaurant.whatsapp.replace(/\D/g, '');
            const recipient = recipientRaw.startsWith('55') ? recipientRaw : `55${recipientRaw}`;

            await fetch(`${apiUrl}/message/sendText/${instance}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': apiKey, 'accept': '*/*' },
              body: JSON.stringify({
                number: recipient,
                textMessage: { text: messageText },
                options: { delay: 1200, presence: 'composing', linkPreview: false }
              })
            });
          }
        } catch (e) {
          console.error('[NOTIFY RESTAURANT ERROR]', e);
        }

        return order;
      } catch (err: any) {
        console.error('[ORDER CREATE ERROR]', err);
        throw new Error(`Erro ao processar pedido: ${err.message}`);
      }
    }),

  updateStatus: publicProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.enum(['pending', 'received', 'preparing', 'shipped', 'delivered', 'cancelled'])
    }))
    .mutation(async ({ input }) => {
      const [order] = await db.update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!order) return null;

      // Enviar notificação via WhatsApp para o cliente
      try {
        const [configRow] = await db.select().from(settings).where(eq(settings.key, 'marketing_config'));
        const config = (configRow?.value as any) || {};

        const apiUrl = config.evolution_url?.replace(/\/$/, '').trim();
        const apiKey = config.evolution_key?.trim();
        const instance = config.evolution_instance?.trim();

        if (!apiUrl || !apiKey || !instance) return order;

        const [orderData] = await db.select({
          customerPhone: customers.phone,
          customerName: customers.name,
          customerAddress: orders.address,
          restaurantName: restaurants.name
        }).from(orders)
          .innerJoin(customers, eq(orders.customerId, customers.id))
          .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
          .where(eq(orders.id, input.orderId));

        if (!orderData || !orderData.customerPhone) return order;

        let statusMsg = '';
        let detailedSummary = '';

        if (input.status === 'received') {
          statusMsg = '✅ *Seu pedido foi recebido com sucesso!*';
          const itemsList = (order.items as any[]).map(i => {
            const base = `• ${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity).toFixed(2)}`;
            const choices = i.choices && i.choices.length > 0 
              ? i.choices.map((c: any) => `  └ ${c.itemName}`).join('\n')
              : '';
            return choices ? `${base}\n${choices}` : base;
          }).join('\n');
          detailedSummary = `\n\n*RESUMO DO PEDIDO:*\n${itemsList}\n\n*Total:* R$ ${Number(order.total).toFixed(2)}\n*Endereço:* ${orderData.customerAddress || 'Retirada no Local'}\n\n🕒 Seu pedido começará a ser preparado em instantes.`;
        }
        
        if (input.status === 'preparing') statusMsg = '👨‍🍳 Seu pedido está sendo preparado agora!';
        if (input.status === 'shipped') statusMsg = '🛵 Ótimas notícias! Seu pedido saiu para entrega!';
        if (input.status === 'delivered') statusMsg = '✅ Seu pedido foi entregue. Bom apetite! 🍔';
        if (input.status === 'cancelled') statusMsg = '❌ Sinto muito, seu pedido foi cancelado pelo restaurante.';

        if (statusMsg) {
          const messageText = `Olá, *${orderData.customerName}*!\n\n${statusMsg}${detailedSummary}\n\n*Pedido:* #${order.id.slice(-4).toUpperCase()}\n*Restaurante:* ${orderData.restaurantName}`;
          const recipientRaw = orderData.customerPhone.replace(/\D/g, '');
          const recipient = recipientRaw.startsWith('55') ? recipientRaw : `55${recipientRaw}`;

          await fetch(`${apiUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey, 'accept': '*/*' },
            body: JSON.stringify({
              number: recipient,
              textMessage: { text: messageText },
              options: { delay: 1200, presence: 'composing', linkPreview: false }
            })
          });
        }
      } catch (error) {
        console.error('[STATUS WHATSAPP ERROR]', error);
      }

      return order;
    }),
});
