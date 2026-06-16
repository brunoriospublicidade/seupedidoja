import 'dotenv/config';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './src/server';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import { db } from './src/server/db';
import { sql } from 'drizzle-orm';
import { restaurants } from './src/server/db/schema';
import { eq } from 'drizzle-orm';

// Database Connection Check
const checkDb = async () => {
  try {
    const test = await db.select().from(restaurants).limit(1);
    console.log('[LOG] Database connection successful');
    
    // Migrações manuais de emergência para evitar erros de coluna ausente
    try {
      await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;`);
      await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS neighborhood TEXT;`);
      await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT;`);
      await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS password TEXT;`);
      await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS pagbank_token TEXT;`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS neighborhood TEXT;`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'delivery';`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pagbank_order_id TEXT;`);
      await db.execute(sql`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS city TEXT;`);
      await db.execute(sql`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS state TEXT;`);
      console.log('[LOG] Manual migrations applied successfully');

      // Seed admin user
      try {
        const adminEmail = 'brunocrios@gmail.com';
        const [existingAdmin] = await db.select().from(restaurants).where(eq(restaurants.email, adminEmail)).limit(1);
        const passwordHash = await bcrypt.hash('bruno', 10);
        if (!existingAdmin) {
          console.log('[SEED] Creating admin user...');
          await db.insert(restaurants).values({
            name: 'Bruno Crios Admin',
            email: adminEmail,
            phone: '999999999',
            whatsapp: '999999999',
            slug: 'admin-bruno',
            password: passwordHash,
            role: 'admin',
            subscriptionPlan: 'gold',
            wizardCompleted: true
          });
          console.log('[SEED] Admin user created successfully');
        } else {
          console.log('[SEED] Admin user already exists. Overwriting password and promoting to admin...');
          await db.update(restaurants).set({
            password: passwordHash,
            role: 'admin',
            subscriptionPlan: 'gold'
          }).where(eq(restaurants.email, adminEmail));
          console.log('[SEED] Admin user updated successfully');
        }
      } catch (seedErr) {
        console.error('[SEED ERROR] Failed to create admin user:', seedErr);
      }

      // Diagnóstico: Listar colunas reais para ter certeza
      const customerCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'customers';`);
      const orderCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';`);
      const addressCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'customer_addresses';`);
      console.log('[DIAGNOSTIC] Customers Columns:', customerCols.map((c: any) => c.column_name).join(', '));
      console.log('[DIAGNOSTIC] Orders Columns:', orderCols.map((c: any) => c.column_name).join(', '));
      console.log('[DIAGNOSTIC] Address Columns:', addressCols.map((c: any) => c.column_name).join(', '));
    } catch (e) {
      console.error('[LOG] Manual migration warning (can be ignored if already exists):', e);
    }
  } catch (err: any) {
    console.error('[ERROR] Database connection failed:', err.message);
  }
};
checkDb();

// --- AUTO-MIGRATION SCRIPT ---
const port = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';
// -----------------------------

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[LOG] ${req.method} ${req.url} - Host: ${req.headers.host} - Status: ${res.statusCode}`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.send('OK - Server is running');
});

import { createContext } from './src/server/trpc';

import multer from 'multer';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// tRPC API
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

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const publicUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  console.log(`[LOG] File uploaded successfully: ${req.file.filename} -> ${publicUrl} (Path: ${req.file.path})`);
  res.json({ url: publicUrl });
});

// Serve uploads statically
console.log(`[LOG] Uploads Path: ${uploadsPath}`);
if (fs.existsSync(uploadsPath)) {
  console.log(`[LOG] Uploads directory exists. Files:`, fs.readdirSync(uploadsPath));
} else {
  console.error(`[ERROR] Uploads directory does NOT exist at: ${uploadsPath}`);
}
app.use('/uploads', express.static(uploadsPath));

// Serve static files from the React app
const distPath = path.join(__dirname, 'dist');
console.log(`[LOG] Serving static files from: ${distPath}`);
try {
  const files = fs.readdirSync(distPath);
  console.log(`[LOG] Files in dist: ${files.join(', ')}`);
} catch (err: any) {
  console.error(`[ERROR] Could not read dist folder: ${err.message}`);
}
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log(`[LOG] index.html found at: ${path.join(distPath, 'index.html')}`);
} else {
  console.error(`[ERROR] index.html NOT found at: ${path.join(distPath, 'index.html')}`);
}
app.use(express.static(distPath));

// Handle React routing, return all requests to React app
app.use((req, res, next) => {
  // Se for uma rota de API ou uploads que chegou aqui, é porque não foi encontrada
  if (req.url.startsWith('/trpc') || req.url.startsWith('/api/upload') || req.url.startsWith('/uploads')) {
    console.log(`[LOG] 404 on protected route: ${req.url}`);
    return res.status(404).send('Not Found');
  }
  
  // Para todas as outras rotas, envia o index.html (React Router)
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built or index.html missing');
  }
});

const PORT = process.env.PORT || 4001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
