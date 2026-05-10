import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { optionalGroups, optionalItems } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const optionalsRouter = router({
  listGroups: publicProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.restaurantId;
    if (!restaurantId) return [];

    const resGroups = await db.select().from(optionalGroups)
      .where(eq(optionalGroups.restaurantId, restaurantId))
      .orderBy(desc(optionalGroups.createdAt));
    
    const resItems = await db.select().from(optionalItems);

    return resGroups.map(group => ({
      ...group,
      optional_items: resItems.filter(item => item.groupId === group.id)
    }));
  }),
  
  createGroup: publicProcedure
    .input(z.object({
      name: z.string(),
      is_mandatory: z.boolean().optional(),
      max_selection: z.number().optional(),
      items: z.array(z.object({
        name: z.string(),
        price: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const restaurantId = ctx.restaurantId;
      if (!restaurantId) throw new Error('Restaurant session not found');

      const { items, ...groupData } = input;
      
      const [group] = await db.insert(optionalGroups)
        .values({
          name: groupData.name,
          isMandatory: groupData.is_mandatory,
          maxSelection: groupData.max_selection,
          restaurantId: restaurantId
        })
        .returning();
      
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          name: item.name,
          price: item.price.toString(),
          groupId: group.id,
        }));
        
        await db.insert(optionalItems).values(itemsToInsert);
      }

      return group;
    }),

  updateGroup: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      is_mandatory: z.boolean().optional(),
      max_selection: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      const mappedData: any = {};
      if (input.name) mappedData.name = input.name;
      if (input.is_mandatory !== undefined) mappedData.isMandatory = input.is_mandatory;
      if (input.max_selection !== undefined) mappedData.maxSelection = input.max_selection;

      const [data] = await db.update(optionalGroups)
        .set(mappedData)
        .where(eq(optionalGroups.id, id))
        .returning();
      
      return data;
    }),

  deleteGroup: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(optionalGroups).where(eq(optionalGroups.id, input.id));
      return true;
    }),

  createItem: publicProcedure
    .input(z.object({
      name: z.string(),
      price: z.number(),
      group_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [data] = await db.insert(optionalItems)
        .values({
          name: input.name,
          price: input.price.toString(),
          groupId: input.group_id
        })
        .returning();
      
      return data;
    }),

  updateItem: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      price: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      const mappedData: any = {};
      if (input.name) mappedData.name = input.name;
      if (input.price !== undefined) mappedData.price = input.price.toString();

      const [data] = await db.update(optionalItems)
        .set(mappedData)
        .where(eq(optionalItems.id, id))
        .returning();
      
      return data;
    }),

  deleteItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(optionalItems).where(eq(optionalItems.id, input.id));
      return true;
    }),
});
