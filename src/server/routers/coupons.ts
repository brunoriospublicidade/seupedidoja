import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { coupons } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const couponsRouter = router({
  list: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return await db.select().from(coupons)
        .where(eq(coupons.restaurantId, input.restaurantId))
        .orderBy(desc(coupons.createdAt));
    }),

  create: publicProcedure
    .input(z.object({
      code: z.string().min(1),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().positive(),
      restaurant_id: z.string(),
      expires_at: z.string().optional().nullable(),
      usage_limit: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const [data] = await db.insert(coupons)
        .values({
          code: input.code.toUpperCase().trim(),
          type: input.type,
          value: input.value.toString(),
          restaurantId: input.restaurant_id,
          expiresAt: input.expires_at ? new Date(input.expires_at) : null,
          usageLimit: input.usage_limit,
          active: true,
          usageCount: 0
        })
        .returning();
      
      return data;
    }),

  toggleStatus: publicProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const [data] = await db.update(coupons)
        .set({ active: input.active })
        .where(eq(coupons.id, input.id))
        .returning();
      
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(coupons).where(eq(coupons.id, input.id));
      return true;
    }),

  validate: publicProcedure
    .input(z.object({ 
      code: z.string(), 
      restaurantId: z.string() 
    }))
    .mutation(async ({ input }) => {
      const [coupon] = await db.select().from(coupons)
        .where(and(
          eq(coupons.code, input.code.toUpperCase().trim()),
          eq(coupons.restaurantId, input.restaurantId),
          eq(coupons.active, true)
        ));

      if (!coupon) return { valid: false, message: 'Cupom inválido ou expirado' };

      // Check usage limit
      if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
        return { valid: false, message: 'Este cupom atingiu o limite de uso' };
      }

      // Check expiration date
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { valid: false, message: 'Este cupom expirou' };
      }

      return { valid: true, coupon };
    }),
});
