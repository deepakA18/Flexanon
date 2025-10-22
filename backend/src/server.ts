import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { getSolanaClient } from './lib/solana';
import shareRoutes from './routes/share';
import devRoutes from './routes/dev';
import relayerRoutes from './routes/relayer';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    const solanaClient = getSolanaClient();
    const networkInfo = await solanaClient.getNetworkInfo();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      solana: networkInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Solana connection failed'
    });
  }
});

app.use('/api/share', shareRoutes);
app.use('/api/relayer', relayerRoutes);

if (process.env.NODE_ENV === 'development') {
  app.use('/api/dev', devRoutes);
  console.log('[DEV] Development routes enabled');
}

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

async function startServer() {
  try {
    console.log('[INIT] Initializing database...');
    await initDatabase();

    console.log('[INIT] Connecting to Solana...');
    const solanaClient = getSolanaClient();
    const networkInfo = await solanaClient.getNetworkInfo();
    
    if (networkInfo) {
      console.log(`[SOLANA] Connected to ${networkInfo.network} (slot: ${networkInfo.slot})`);
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('FlexAnon Backend Server');
      console.log('======================');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Solana Network: ${process.env.SOLANA_NETWORK || 'localnet'}`);
      console.log(`Program ID: ${process.env.SOLANA_PROGRAM_ID || 'Not Set'}`);
      console.log('======================');
      console.log('');
    });

  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
