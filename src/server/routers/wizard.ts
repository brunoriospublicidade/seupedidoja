import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { restaurants, categories, products, optionalGroups, optionalItems } from '../db/schema';
import { eq } from 'drizzle-orm';

export const wizardRouter = router({
  saveBatch: publicProcedure
    .input(z.object({
      categories: z.array(z.string()),
      products: z.array(z.string()),
      optionals: z.array(z.object({
        name: z.string(),
        items: z.array(z.string())
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error("Não autorizado");

      // 1. Create categories
      const createdCategories = [];
      for (let i = 0; i < input.categories.length; i++) {
        const [cat] = await db.insert(categories).values({
          restaurantId,
          name: input.categories[i],
          order: i,
          color: '#F59E0B'
        }).returning();
        createdCategories.push(cat);
      }

      // 3. Create optional groups and items
      const optionalGroupIds = [];
      for (const group of input.optionals) {
        const [newGroup] = await db.insert(optionalGroups).values({
          restaurantId,
          name: group.name,
          isMandatory: false,
          maxSelection: group.name.toLowerCase().includes('tamanho') ? 1 : 10
        }).returning();

        if (newGroup) {
          optionalGroupIds.push(newGroup.id);
          for (const itemName of group.items) {
            await db.insert(optionalItems).values({
              groupId: newGroup.id,
              name: itemName,
              price: '0'
            });
          }
        }
      }

      // 2. Create products (all in the first category or a default one)
      const defaultCategoryId = createdCategories[0]?.id;
      if (defaultCategoryId) {
        for (const productName of input.products) {
          await db.insert(products).values({
            restaurantId,
            categoryId: defaultCategoryId,
            name: productName,
            price: '0',
            description: 'Produto sugerido pelo assistente',
            optionals: optionalGroupIds // Linking all selected optionals to all products
          });
        }
      }

      // 4. Mark wizard as completed
      await db.update(restaurants)
        .set({ wizardCompleted: true })
        .where(eq(restaurants.id, restaurantId));

      return { success: true };
    })
});
