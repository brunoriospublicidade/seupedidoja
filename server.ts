import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './src/server';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[LOG] ${req.method} ${req.url}`);
  next();
});

import { createContext } from './src/server/trpc';

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[TRPC ERROR] path: ${path}, code: ${error.code}, message: ${error.message}`);
    }
  })
);

const PORT = 4001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`tRPC server explicitly listening on http://127.0.0.1:${PORT}`);
});
