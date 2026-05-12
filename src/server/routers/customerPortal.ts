import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { customers, customerAddresses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const customerPortalRouter = router({
  register: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      password: z.string(),
      address: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[REGISTER ATTEMPT]', { email: input.email, restaurantId: input.restaurantId });
        
        // Check if email already exists for this restaurant
        const [existing] = await db.select().from(customers)
          .where(and(
            eq(customers.email, input.email),
            eq(customers.restaurantId, input.restaurantId)
          ));

        if (existing) {
          throw new Error('Este e-mail já está cadastrado.');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        // 1. Create Customer
        const [customer] = await db.insert(customers)
          .values({
            restaurantId: input.restaurantId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            password: hashedPassword,
          })
          .returning();

        // 2. Create Initial Address if provided
        if (input.address && typeof input.address === 'object') {
          try {
            await db.insert(customerAddresses)
              .values({
                customerId: customer.id,
                name: input.address.name || 'Principal',
                cep: input.address.cep || '',
                address: input.address.address || '',
                number: input.address.number || '',
                complement: input.address.complement || '',
                neighborhood: input.address.neighborhood || '',
                city: input.address.city || '',
                state: input.address.state || 'SP'
              });
          } catch (addrErr) {
            console.error('[REGISTER ADDRESS ERROR]', addrErr);
            // Don't fail the whole registration if address fail
          }
        }

        const { password: _, ...userWithoutPassword } = customer;
        return userWithoutPassword;
      } catch (err: any) {
        console.error('[REGISTER CRITICAL ERROR]', err);
        throw new Error(err.message || 'Erro interno no servidor');
      }
    }),

  login: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      email: z.string(),
      password: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[LOGIN ATTEMPT]', { email: input.email, restaurantId: input.restaurantId });
        
        const [customer] = await db.select().from(customers)
          .where(and(
            eq(customers.email, input.email),
            eq(customers.restaurantId, input.restaurantId)
          ));

        if (!customer || !customer.password) {
          throw new Error('E-mail ou senha incorretos.');
        }

        const validPassword = await bcrypt.compare(input.password, customer.password);
        if (!validPassword) {
          throw new Error('E-mail ou senha incorretos.');
        }

        const { password: _, ...userWithoutPassword } = customer;
        return userWithoutPassword;
      } catch (err: any) {
        console.error('[LOGIN CRITICAL ERROR]', err);
        throw new Error(err.message || 'Erro interno no servidor');
      }
    }),

  getProfile: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      const [customer] = await db.select().from(customers)
        .where(eq(customers.id, input.customerId));
      
      if (!customer) throw new Error('Cliente não encontrado');

      const { password: _, ...userWithoutPassword } = customer;
      return userWithoutPassword;
    }),

  // Endereços
  listAddresses: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      return await db.select().from(customerAddresses)
        .where(eq(customerAddresses.customerId, input.customerId));
    }),

  addAddress: publicProcedure
    .input(z.object({
      customerId: z.string(),
      name: z.string(),
      cep: z.string(),
      address: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string(),
      city: z.string(),
      state: z.string()
    }))
    .mutation(async ({ input }) => {
      const [newAddress] = await db.insert(customerAddresses)
        .values({
          customerId: input.customerId,
          name: input.name,
          cep: input.cep,
          address: input.address,
          number: input.number,
          complement: input.complement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state
        })
        .returning();
      return newAddress;
    }),

  deleteAddress: publicProcedure
    .input(z.object({ addressId: z.string(), customerId: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(customerAddresses)
        .where(and(
          eq(customerAddresses.id, input.addressId),
          eq(customerAddresses.customerId, input.customerId)
        ));
      return true;
    }),
});
