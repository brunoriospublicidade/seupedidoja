import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { products, subcategories, restaurants } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const productsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    const res = await db.select({
      product: products,
      subcategory: subcategories
    })
    .from(products)
    .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
    .where(eq(products.restaurantId, restaurantId))
    .orderBy(asc(products.name));
    
    return res.map(row => ({
      ...row.product,
      subcategories: row.subcategory
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
  upsertProducts: publicProcedure
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

      // 1. Get all current products
      const currentProducts = await db.select().from(products)
        .where(eq(products.restaurantId, restaurantId));

      const toUpdate = [];
      const toInsert = [];

      for (const p of input) {
        const existing = currentProducts.find(curr => 
          curr.name.trim().toLowerCase() === p.name.trim().toLowerCase() && 
          curr.categoryId === p.category_id
        );

        if (existing) {
          toUpdate.push({
            id: existing.id,
            data: {
              description: p.description,
              price: p.price.toString(),
              optionals: p.optionals || existing.optionals,
              subcategoryId: p.subcategory_id || existing.subcategoryId,
            }
          });
        } else {
          toInsert.push({
            name: p.name,
            description: p.description,
            price: p.price.toString(),
            categoryId: p.category_id,
            subcategoryId: p.subcategory_id,
            imageUrl: p.image_url,
            optionals: p.optionals,
            restaurantId: restaurantId
          });
        }
      }

      // 2. Perform Insertions
      if (toInsert.length > 0) {
        await db.insert(products).values(toInsert);
      }

      // 3. Perform Updates (Drizzle doesn't have bulk update with different values easily, so we loop)
      for (const update of toUpdate) {
        await db.update(products)
          .set(update.data)
          .where(eq(products.id, update.id));
      }

      return { inserted: toInsert.length, updated: toUpdate.length };
    }),

  resetMenu: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      // 1. Verify password
      const [restaurant] = await db.select().from(restaurants)
        .where(eq(restaurants.id, restaurantId));
      
      if (!restaurant || !restaurant.password) {
        throw new Error('Configuração de segurança não encontrada.');
      }

      const isPasswordValid = await bcrypt.compare(input.password, restaurant.password);
      
      if (!isPasswordValid) {
        throw new Error('Senha incorreta. O cardápio não foi resetado.');
      }

      // 2. Delete all products
      await db.delete(products).where(eq(products.restaurantId, restaurantId));

      return { success: true };
    }),
  bulkUpdateOptionals: publicProcedure
    .input(z.object({
      productIds: z.array(z.string()),
      optionalGroupIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const { productIds, optionalGroupIds } = input;

      for (const id of productIds) {
        await db.update(products)
          .set({ optionals: optionalGroupIds })
          .where(eq(products.id, id));
      }

      return { success: true, count: productIds.length };
    }),
});
