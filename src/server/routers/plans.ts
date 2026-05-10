import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { plans } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export const plansRouter = router({
  list: publicProcedure.query(async () => {
    return await db.select().from(plans).orderBy(asc(plans.sortOrder));
  }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      price: z.string(),
      stripe_price_id: z.string().optional(),
      features: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const [data] = await db.update(plans)
        .set({
          name: input.name,
          price: input.price,
          stripePriceId: input.stripe_price_id,
          features: input.features,
        })
        .where(eq(plans.id, input.id))
        .returning();
      
      return data;
    }),
});
