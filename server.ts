import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabase } from './server/db/database.ts';
import customersRouter from './server/routes/customers.ts';
import conversationsRouter from './server/routes/conversations.ts';
import ticketsRouter from './server/routes/tickets.ts';
import memoriesRouter from './server/routes/memories.ts';
import analyticsRouter from './server/routes/analytics.ts';
import comparisonRouter from './server/routes/comparison.ts';
import hindsightRouter from './server/routes/hindsight.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize SQLite Database schema & seeds
initDatabase();

app.use(express.json());

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/comparison', comparisonRouter);
app.use('/api/hindsight', hindsightRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'SupportMind',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: null, // AI Studio: disable file watching to save CPU
        hmr: false,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SupportMind] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SupportMind] Failed to start server:', err);
  process.exit(1);
});
