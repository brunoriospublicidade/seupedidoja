import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

export const settingsRouter = router({
  get: publicProcedure
    .query(async () => {
      const [config] = await db.select()
        .from(settings)
        .where(eq(settings.key, 'marketing_config'));

      if (!config) {
        return {
          free_credits: 30,
          price_per_message: 0.15
        };
      }

      return config.value;
    }),

  update: publicProcedure
    .input(z.object({
      free_credits: z.number(),
      price_per_message: z.number(),
      evolution_url: z.string().optional(),
      evolution_key: z.string().optional(),
      evolution_instance: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(settings)
        .values({
          key: 'marketing_config',
          value: input,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: input,
            updatedAt: new Date()
          }
        });

      return { success: true };
    }),
});
