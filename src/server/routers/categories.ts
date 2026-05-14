import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { categories, subcategories, products } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const categoriesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    // Fetch categories
    const resCategories = await db.select().from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(asc(categories.order));
    
    // Fetch subcategories
    const resSubcategories = await db.select().from(subcategories);

    // Fetch products to count them per category
    const resProducts = await db.select().from(products)
      .where(eq(products.restaurantId, restaurantId));

    return resCategories.map(cat => ({
      ...cat,
      subcategories: resSubcategories.filter(sub => sub.categoryId === cat.id),
      productCount: resProducts.filter(p => p.categoryId === cat.id).length || 0
    }));
  }),
  
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      color: z.string(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const [data] = await db.insert(categories)
        .values({ 
          name: input.name, 
          color: input.color, 
          order: input.order,
          restaurantId: restaurantId 
        })
        .returning();
      
      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [data] = await db.update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning();
      
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(categories).where(eq(categories.id, input.id));
      return true;
    }),

  createSubcategory: publicProcedure
    .input(z.object({
      category_id: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [data] = await db.insert(subcategories)
        .values({
          categoryId: input.category_id,
          name: input.name
        })
        .returning();
      
      return data;
    }),

  deleteSubcategory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(subcategories).where(eq(subcategories.id, input.id));
      return true;
    }),
  swapOrder: publicProcedure
    .input(z.object({
      id1: z.string(),
      order1: z.number(),
      id2: z.string(),
      order2: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.update(categories).set({ order: input.order2 }).where(eq(categories.id, input.id1));
      await db.update(categories).set({ order: input.order1 }).where(eq(categories.id, input.id2));
      return true;
    }),
});
