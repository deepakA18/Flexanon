import { ZerionPortfolio, ZerionAsset } from '../types/index.js';

/**
 * Mock Zerion client for testing without API key
 */

export class MockZerionClient {
  /**
   * Generate fake portfolio data for testing
   */
  async getPortfolio(walletAddress: string, chain: string = 'solana'): Promise<ZerionPortfolio> {
    console.log(`🎭 MOCK: Generating fake portfolio for ${walletAddress}...`);

    // Generate random realistic data
    const baseValue = Math.random() * 100000 + 10000; // $10k - $110k
    const pnl = Math.random() * 300 - 50; // -50% to +250%

    const mockAssets: ZerionAsset[] = [
      {
        asset_code: 'SOL',
        symbol: 'SOL',
        name: 'Solana',
        quantity: (Math.random() * 100 + 10).toFixed(2),
        price: 200 + Math.random() * 50,
        value: baseValue * 0.4,
        icon_url: 'https://cdn.zerion.io/icons/solana.png'
      },
      {
        asset_code: 'USDC',
        symbol: 'USDC',
        name: 'USD Coin',
        quantity: (Math.random() * 50000 + 5000).toFixed(2),
        price: 1,
        value: baseValue * 0.3,
        icon_url: 'https://cdn.zerion.io/icons/usdc.png'
      },
      {
        asset_code: 'JUP',
        symbol: 'JUP',
        name: 'Jupiter',
        quantity: (Math.random() * 10000 + 1000).toFixed(2),
        price: 1.2 + Math.random() * 0.5,
        value: baseValue * 0.15,
      },
      {
        asset_code: 'BONK',
        symbol: 'BONK',
        name: 'Bonk',
        quantity: (Math.random() * 1000000 + 100000).toFixed(0),
        price: 0.00002,
        value: baseValue * 0.1,
      },
      {
        asset_code: 'RAY',
        symbol: 'RAY',
        name: 'Raydium',
        quantity: (Math.random() * 500 + 50).toFixed(2),
        price: 3.5 + Math.random() * 2,
        value: baseValue * 0.05,
      }
    ];

    return {
      wallet_address: walletAddress,
      chain,
      total_value: baseValue,
      pnl_percentage: pnl,
      assets: mockAssets,
      snapshot_timestamp: Date.now()
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Mock chart data
   */
  async getChartData(
    walletAddress: string,
    period: 'day' | 'week' | 'month' | 'year' = 'day'
  ) {
    console.log(`🎭 MOCK: Generating fake chart data for ${walletAddress} (${period})...`);
    
    // Generate mock time series data
    const now = Date.now();
    const intervals = period === 'day' ? 288 : period === 'week' ? 168 : period === 'month' ? 720 : 365; // 5min intervals for day
    const interval = period === 'day' ? 300000 : period === 'week' ? 3600000 : period === 'month' ? 3600000 : 86400000; // ms per interval
    
    const baseValue = Math.random() * 10000 + 1000;
    const points: [number, number][] = [];
    
    for (let i = 0; i < intervals; i++) {
      const timestamp = Math.floor((now - (intervals - i) * interval) / 1000);
      const variation = (Math.random() - 0.5) * baseValue * 0.1; // ±10% variation
      const value = baseValue + variation;
      points.push([timestamp, value]);
    }
    
    return {
      type: 'wallet_chart',
      id: `${walletAddress}-${period}`,
      attributes: {
        begin_at: new Date(now - intervals * interval).toISOString(),
        end_at: new Date(now).toISOString(),
        points
      }
    };
  }
}

/**
 * Get appropriate client based on environment
 */
export async function getZerionClientOrMock() {
  const apiKey = process.env.ZERION_API_KEY;
  
  if (!apiKey || apiKey === 'your_zerion_api_key_here') {
    console.log('⚠️  No Zerion API key found - using MOCK data');
    return new MockZerionClient();
  }

  // Return real client when API key is available
  const { getZerionClient } = await import('./zerion.js');
  return getZerionClient();
}

export default MockZerionClient;
