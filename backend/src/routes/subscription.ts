import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';

const router = Router();

/**
 * HACKATHON MVP - Simple subscription system
 * No payments, just demo functionality
 */

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
      plan: sub.plan,
      status: sub.status,
      updates_used: sub.updates_used,
      updates_remaining: sub.updates_limit - sub.updates_used,
      updates_limit: sub.updates_limit,
      links_used: sub.links_used,
      links_remaining: sub.links_limit - sub.links_used,
      links_limit: sub.links_limit,
      expires_at: sub.expires_at,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

/**
 * POST /api/subscription/use-update
 * Increment update counter
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

    // Check if limit reached
    if (sub.updates_used >= sub.updates_limit) {
      return res.status(403).json({
        error: 'Update limit reached',
        message: sub.plan === 'free' 
          ? 'Upgrade to Pro for 1000 updates/month'
          : 'Monthly update limit reached',
        updates_used: sub.updates_used,
        updates_limit: sub.updates_limit,
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
    });
  } catch (error: any) {
    console.error('Error using update:', error);
    res.status(500).json({ error: 'Failed to use update' });
  }
});

/**
 * POST /api/subscription/upgrade-demo
 * DEMO ONLY: Upgrade to pro without payment
 * In production, this would integrate with Stripe
 */
router.post('/upgrade-demo', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address required' });
    }

    console.log(`📈 Demo upgrade: ${wallet_address} → Pro`);

    // Upgrade to Pro
    await query(
      `INSERT INTO subscriptions (wallet_address, plan, updates_limit, links_limit, expires_at)
       VALUES ($1, 'pro', 1000, 3, NOW() + INTERVAL '30 days')
       ON CONFLICT (wallet_address)
       DO UPDATE SET 
         plan = 'pro',
         updates_limit = 1000,
         links_limit = 3,
         expires_at = NOW() + INTERVAL '30 days',
         status = 'active'`,
      [wallet_address]
    );

    res.json({
      success: true,
      plan: 'pro',
      message: 'Upgraded to Pro! (Demo mode - no payment required)',
      updates_limit: 1000,
      links_limit: 3,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

/**
 * POST /api/subscription/downgrade-demo
 * DEMO ONLY: Downgrade back to free
 */
router.post('/downgrade-demo', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address required' });
    }

    console.log(`📉 Demo downgrade: ${wallet_address} → Free`);

    await query(
      `UPDATE subscriptions
       SET plan = 'free',
           updates_limit = 10,
           links_limit = 1,
           updates_used = 0,
           expires_at = NULL
       WHERE wallet_address = $1`,
      [wallet_address]
    );

    res.json({
      success: true,
      plan: 'free',
      message: 'Downgraded to Free tier',
    });
  } catch (error: any) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ error: 'Failed to downgrade subscription' });
  }
});

export default router;
