import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { getSolanaClient } from './lib/solana';
import shareRoutes from './routes/share';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
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

// API routes
app.use('/api/share', shareRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initDatabase();

    // Initialize Solana client
    console.log('🔄 Connecting to Solana...');
    const solanaClient = getSolanaClient();
    const networkInfo = await solanaClient.getNetworkInfo();
    
    if (networkInfo) {
      console.log(`✅ Solana connected: ${networkInfo.network} (slot: ${networkInfo.slot})`);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 FlexAnon Backend Server');
      console.log('================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 Solana Integration:');
      console.log(`   Network: ${process.env.SOLANA_NETWORK || 'localnet'}`);
      console.log(`   RPC: ${process.env.SOLANA_RPC_URL || 'http://localhost:8899'}`);
      console.log(`   Program ID: ${process.env.SOLANA_PROGRAM_ID || 'Not Set'}`);
      console.log('');
      console.log('📡 API Endpoints:');
      console.log(`   POST   /api/share/generate`);
      console.log(`   GET    /api/share/resolve?token=xxx`);
      console.log(`   POST   /api/share/verify`);
      console.log(`   POST   /api/share/revoke`);
      console.log(`   GET    /api/share/my-tokens?wallet=xxx`);
      console.log(`   GET    /api/share/commitment/:address`);
      console.log('');
      console.log('🔐 Privacy: SMT-based selective disclosure');
      console.log('⛓️  On-chain: Merkle root commitments on Solana');
      console.log('🌐 Zerion API integration enabled');
      console.log('================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
