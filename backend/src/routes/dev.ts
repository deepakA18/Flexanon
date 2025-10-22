/**
 * DEVELOPMENT ONLY - Test endpoint without signature
 * This bypasses authentication for testing Zerion integration
 * REMOVE IN PRODUCTION!
 */

import { Router, Request, Response } from 'express';
import { getZerionClientOrMock } from '../lib/mock-zerion';
import { PublicKey } from '@solana/web3.js';

const router = Router();

/**
 * DEV ONLY: Test Zerion integration without auth
 */
router.post('/test-zerion', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    console.log(`🧪 [DEV TEST] Fetching portfolio for ${wallet_address}...`);

    // Validate Solana address
    try {
      new PublicKey(wallet_address);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    // Fetch from Zerion
    const zerionClient = await getZerionClientOrMock();
    const portfolio = await zerionClient.getPortfolio(wallet_address, 'solana');

    res.json({
      success: true,
      portfolio: {
        wallet_address: portfolio.wallet_address,
        chain: portfolio.chain,
        total_value: portfolio.total_value,
        pnl_percentage: portfolio.pnl_percentage,
        assets_count: portfolio.assets.length,
        assets: portfolio.assets,
        snapshot_timestamp: portfolio.snapshot_timestamp
      }
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio',
      details: error.message 
    });
  }
});

/**
 * DEV ONLY: Health check
 */
router.get('/test-health', async (req: Request, res: Response) => {
  try {
    const zerionClient = await getZerionClientOrMock();
    const healthy = await zerionClient.healthCheck();
    
    res.json({
      zerion_api: healthy ? 'connected' : 'failed',
      api_key_set: !!process.env.ZERION_API_KEY,
      mock_mode: !process.env.ZERION_API_KEY || process.env.ZERION_API_KEY === 'your_zerion_api_key_here'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

export default router;
