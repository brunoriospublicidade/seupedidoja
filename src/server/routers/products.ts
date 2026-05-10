import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { products, subcategories } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export const productsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    const resProducts = await db.select().from(products)
      .where(eq(products.restaurantId, restaurantId))
      .orderBy(asc(products.name));
    
    // Fetch subcategories to join name manually for now (or use real join)
    const resSubcategories = await db.select().from(subcategories);

    return resProducts.map(prod => ({
      ...prod,
      subcategories: resSubcategories.find(sub => sub.id === prod.subcategoryId) || null
    }));
  }),
    
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category_id: z.string(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const [data] = await db.insert(products)
        .values({
          name: input.name,
          description: input.description,
          price: input.price.toString(),
          categoryId: input.category_id,
          subcategoryId: input.subcategory_id,
          imageUrl: input.image_url,
          optionals: input.optionals,
          restaurantId: restaurantId
        })
        .returning();
      
      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      category_id: z.string().optional(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      const mappedData: any = {};
      if (input.name) mappedData.name = input.name;
      if (input.description) mappedData.description = input.description;
      if (input.price !== undefined) mappedData.price = input.price.toString();
      if (input.category_id) mappedData.categoryId = input.category_id;
      if (input.subcategory_id) mappedData.subcategoryId = input.subcategory_id;
      if (input.image_url) mappedData.imageUrl = input.image_url;
      if (input.optionals) mappedData.optionals = input.optionals;

      const [data] = await db.update(products)
        .set(mappedData)
        .where(eq(products.id, id))
        .returning();
      
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id));
      return true;
    }),

  bulkCreate: publicProcedure
    .input(z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category_id: z.string(),
      subcategory_id: z.string().optional(),
      image_url: z.string().optional(),
      optionals: z.any().optional(),
    })))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const values = input.map(p => ({
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        categoryId: p.category_id,
        subcategoryId: p.subcategory_id,
        imageUrl: p.image_url,
        optionals: p.optionals,
        restaurantId: restaurantId
      }));

      return await db.insert(products).values(values).returning();
    }),
});
