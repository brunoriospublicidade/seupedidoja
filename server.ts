import 'dotenv/config';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './src/server';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

import { db } from './src/server/db';
import { sql } from 'drizzle-orm';
import { restaurants } from './src/server/db/schema';

// Database Connection Check
const checkDb = async () => {
  try {
    const test = await db.select().from(restaurants).limit(1);
    console.log('[LOG] Database connection successful');
    
    // Migrações manuais de emergência para evitar erros de coluna ausente
    try {
      await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;`);
      await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT;`);
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS neighborhood TEXT;`);
      console.log('[LOG] Manual migrations applied successfully');
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
  res.json({ url: publicUrl });
});

// Serve uploads statically
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
app.use((req, res) => {
  if (req.url.startsWith('/trpc')) return;
  if (req.url.startsWith('/api/upload')) return;
  if (req.url.startsWith('/uploads')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 4001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
