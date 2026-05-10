import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { stripe } from '../../lib/stripe';
import { db } from '../db';
import { restaurants } from '../db/schema';
import { eq } from 'drizzle-orm';

export const paymentsRouter = router({
  getSubscriptionInfo: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const [restaurant] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId));

      if (!restaurant?.stripeCustomerId) {
        return { hasActiveSubscription: false, invoices: [] };
      }

      // Fetch active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: restaurant.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      // Fetch recent invoices
      const invoices = await stripe.invoices.list({
        customer: restaurant.stripeCustomerId,
        limit: 5,
      });

      return {
        hasActiveSubscription: subscriptions.data.length > 0,
        currentSubscription: subscriptions.data[0],
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          date: new Date(inv.created * 1000).toLocaleDateString('pt-BR'),
          amount: (inv.amount_paid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          status: inv.status,
          pdf: inv.invoice_pdf,
          method: (inv as any).payment_intent ? 'Cartão' : 'Pix' // Simplified
        }))
      };
    }),

  createCheckoutSession: publicProcedure
    .input(z.object({
      priceId: z.string(),
      restaurantId: z.string(),
      planId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [restaurant] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId));

      if (!restaurant) throw new Error('Restaurante não encontrado');

      const successUrl = (process.env.STRIPE_SUCCESS_URL || 'http://localhost:5176/admin/configuracoes?success=true') + '&session_id={CHECKOUT_SESSION_ID}';

      const session = await stripe.checkout.sessions.create({
        customer: restaurant.stripeCustomerId || undefined, 
        payment_method_types: ['card'],
        line_items: [{ price: input.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5176/admin/configuracoes?canceled=true',
        metadata: {
          restaurantId: input.restaurantId,
          planId: input.planId,
        },
        customer_email: !restaurant.stripeCustomerId ? restaurant.email || undefined : undefined,
      });

      return { url: session.url };
    }),

  verifySubscription: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        
        if (session.payment_status === 'paid' && session.metadata?.restaurantId) {
          const restaurantId = session.metadata.restaurantId;
          const planId = session.metadata.planId;
          const customerId = session.customer as string;

          // Update the restaurant plan AND save the stripe_customer_id
          await db.update(restaurants)
            .set({ 
              subscriptionPlan: planId,
              stripeCustomerId: customerId 
            })
            .where(eq(restaurants.id, restaurantId));

          return { success: true, planId };
        }
        
        return { success: false };
      } catch (err) {
        console.error('Error verifying subscription:', err);
        return { success: false };
      }
    }),

  createPortalSession: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [restaurant] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId));

      if (!restaurant?.stripeCustomerId) throw new Error('Nenhuma assinatura ativa encontrada');

      const session = await stripe.billingPortal.sessions.create({
        customer: restaurant.stripeCustomerId,
        return_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5176/admin/configuracoes',
      });

      return { url: session.url };
    }),
});
