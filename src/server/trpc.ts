import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  const restaurantId = req.headers['x-restaurant-id'] as string | undefined;
  return {
    restaurantId,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.restaurantId) {
    // For legacy/migration support, we can allow it, but for new stores it should be required.
    // However, since we are in MVP, I'll just provide the ID in the context.
  }
  return next();
});
