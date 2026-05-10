import { router } from './trpc';
import { categoriesRouter } from './routers/categories';
import { productsRouter } from './routers/products';
import { optionalsRouter } from './routers/optionals';
import { restaurantsRouter } from './routers/restaurants';
import { plansRouter } from './routers/plans';
import { paymentsRouter } from './routers/payments';
import { couponsRouter } from './routers/coupons';

import { ordersRouter } from './routers/orders';
import { customersRouter } from './routers/customers';
import { settingsRouter } from './routers/settings';
import { marketingRouter } from './routers/marketing';

export const appRouter = router({
  categories: categoriesRouter,
  products: productsRouter,
  optionals: optionalsRouter,
  restaurants: restaurantsRouter,
  plans: plansRouter,
  payments: paymentsRouter,
  coupons: couponsRouter,
  orders: ordersRouter,
  customers: customersRouter,
  settings: settingsRouter,
  marketing: marketingRouter,
});

export type AppRouter = typeof appRouter;
