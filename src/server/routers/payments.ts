import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { stripe } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';

export const paymentsRouter = router({
  getSubscriptionInfo: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('stripe_customer_id, subscription_plan')
        .eq('id', input.restaurantId)
        .single();

      if (!restaurant?.stripe_customer_id) {
        return { hasActiveSubscription: false, invoices: [] };
      }

      // Fetch active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: restaurant.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      // Fetch recent invoices
      const invoices = await stripe.invoices.list({
        customer: restaurant.stripe_customer_id,
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
          method: inv.payment_intent ? 'Cartão' : 'Pix' // Simplified
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
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', input.restaurantId)
        .single();

      if (!restaurant) throw new Error('Restaurante não encontrado');

      const successUrl = (process.env.STRIPE_SUCCESS_URL || 'http://localhost:5176/admin/configuracoes?success=true') + '&session_id={CHECKOUT_SESSION_ID}';

      const session = await stripe.checkout.sessions.create({
        customer: restaurant.stripe_customer_id || undefined, // Use existing customer if available
        payment_method_types: ['card'],
        line_items: [{ price: input.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5176/admin/configuracoes?canceled=true',
        metadata: {
          restaurantId: input.restaurantId,
          planId: input.planId,
        },
        customer_email: !restaurant.stripe_customer_id ? restaurant.email || undefined : undefined,
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
          const { error } = await supabase
            .from('restaurants')
            .update({ 
              subscription_plan: planId,
              stripe_customer_id: customerId 
            })
            .eq('id', restaurantId);

          if (error) throw error;
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
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('stripe_customer_id')
        .eq('id', input.restaurantId)
        .single();

      if (!restaurant?.stripe_customer_id) throw new Error('Nenhuma assinatura ativa encontrada');

      const session = await stripe.billingPortal.sessions.create({
        customer: restaurant.stripe_customer_id,
        return_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5176/admin/configuracoes',
      });

      return { url: session.url };
    }),
});
