import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';

const router = Router();


/**
 * GET /api/subscription/status?wallet=xxx
 * Get current subscription status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ error: 'wallet parameter required' });
    }

    // Get or create subscription
    let result = await query(
      'SELECT * FROM subscriptions WHERE wallet_address = $1',
      [wallet]
    );

    // Create free tier if doesn't exist
    if (result.rows.length === 0) {
      await query(
        `INSERT INTO subscriptions (wallet_address, plan, updates_limit, links_limit)
         VALUES ($1, 'free', 10, 1)`,
        [wallet]
      );

      result = await query(
        'SELECT * FROM subscriptions WHERE wallet_address = $1',
        [wallet]
      );
    }

    const sub = result.rows[0];

    res.json({
      plan: sub.plan, // Always 'free' for now
      status: sub.status,
      updates_used: sub.updates_used,
      updates_remaining: sub.updates_limit - sub.updates_used,
      updates_limit: sub.updates_limit, // 10 for free tier
      links_used: sub.links_used,
      links_remaining: sub.links_limit - sub.links_used,
      links_limit: sub.links_limit, // 1 for free tier
      expires_at: null, // Free tier doesn't expire
      pro_available: false, // Pro subscription coming soon
      message: 'Free tier: 10 portfolio refreshes'
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

/**
 * POST /api/subscription/use-update
 * Increment update counter (free tier only)
 */
router.post('/use-update', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address required' });
    }

    // Get subscription
    const result = await query(
      'SELECT * FROM subscriptions WHERE wallet_address = $1',
      [wallet_address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const sub = result.rows[0];

    // Check if limit reached (10 for free tier)
    if (sub.updates_used >= sub.updates_limit) {
      return res.status(403).json({
        error: 'Update limit reached',
        message: 'You have used all 10 free portfolio refreshes. Pro subscription coming soon!',
        updates_used: sub.updates_used,
        updates_limit: sub.updates_limit,
        pro_coming_soon: true
      });
    }

    // Increment counter
    await query(
      `UPDATE subscriptions 
       SET updates_used = updates_used + 1
       WHERE wallet_address = $1`,
      [wallet_address]
    );

    res.json({
      success: true,
      updates_used: sub.updates_used + 1,
      updates_remaining: sub.updates_limit - sub.updates_used - 1,
      message: `${sub.updates_limit - sub.updates_used - 1} refreshes remaining`
    });
  } catch (error: any) {
    console.error('Error using update:', error);
    res.status(500).json({ error: 'Failed to use update' });
  }
});

/**
 * GET /api/subscription/plans
 * Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free Tier',
        price: 0,
        currency: 'USD',
        interval: 'lifetime',
        features: [
          '10 portfolio refreshes',
          '1 active share link',
          'Merkle proof privacy',
          'On-chain commitment',
          'Basic analytics'
        ],
        updates_limit: 10,
        links_limit: 1,
        available: true
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited portfolio refreshes',
          '10 active share links',
          'Advanced analytics',
          'Custom privacy settings',
          'Priority support',
          'API access'
        ],
        updates_limit: -1, // Unlimited
        links_limit: 10,
        available: false,
        coming_soon: true,
        estimated_launch: 'Q1 2026'
      }
    ]
  });
});

/**
 * POST /api/subscription/reset-demo
 * DEMO ONLY: Reset free tier counter for testing
 */
router.post('/reset-demo', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address required' });
    }

    console.log(`🔄 Demo reset: ${wallet_address} counter reset`);

    await query(
      `UPDATE subscriptions
       SET updates_used = 0
       WHERE wallet_address = $1`,
      [wallet_address]
    );

    res.json({
      success: true,
      message: 'Free tier counter reset to 0',
      updates_remaining: 10
    });
  } catch (error: any) {
    console.error('Error resetting subscription:', error);
    res.status(500).json({ error: 'Failed to reset subscription' });
  }
});

export default router;
