import axios, { AxiosInstance } from 'axios';
import { ZerionPortfolio, ZerionAsset } from '../types/index.js';

/**
 * Zerion API Client (Updated for v1 API)
 * Docs: https://developers.zerion.io/reference/intro-getting-started
 */

export class ZerionClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // Zerion uses Basic Auth with API key as username (password is empty)
    const authHeader = `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`;
    
    this.client = axios.create({
      baseURL: 'https://api.zerion.io/v1',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Fetch wallet portfolio
   */
  async getPortfolio(walletAddress: string, chain: string = 'solana'): Promise<ZerionPortfolio> {
    try {
      console.log(`📊 Fetching Zerion portfolio for ${walletAddress}...`);

      // 1. Fetch portfolio summary
      const portfolioResponse = await this.client.get(
        `/wallets/${walletAddress}/portfolio`,
        {
          params: {
            'currency': 'usd',
            'filter[positions]': 'only_simple'
          }
        }
      );

      const portfolioData = portfolioResponse.data.data.attributes;
      const totalValue = portfolioData.total?.positions || 0;
      const changes = portfolioData.changes || {};
      
      // Calculate PnL percentage
      const absolute1d = changes.absolute_1d || 0;
      const pnlPercentage = changes.percent_1d || 0;

      // 2. Fetch positions (assets)
      const positionsResponse = await this.client.get(
        `/wallets/${walletAddress}/positions/`,
        {
          params: {
            'currency': 'usd',
            'filter[positions]': 'only_simple',
            'filter[trash]': 'only_non_trash',
            'filter[chain_ids]': chain,
            'sort': 'value'
          }
        }
      );

      const positions = positionsResponse.data.data || [];

      // Parse assets WITH changes data
      const assets: ZerionAsset[] = positions.map((position: any) => {
        const attributes = position.attributes || {};
        const fungibleInfo = attributes.fungible_info || {};
        const quantity = attributes.quantity || {};
        const value = attributes.value || 0;
        const price = attributes.price || 0;
        const changes = attributes.changes || {};

        // Find the implementation for the current chain
        const implementations = fungibleInfo.implementations || [];
        const chainImpl = implementations.find((impl: any) => impl.chain_id === chain);

        return {
          asset_code: chainImpl?.address || 'unknown',
          symbol: fungibleInfo.symbol || 'UNKNOWN',
          name: fungibleInfo.name || 'Unknown Asset',
          quantity: quantity.numeric || '0',
          price: price,
          value: value,
          icon_url: fungibleInfo.icon?.url,
          changes: {
            absolute_1d: changes.absolute_1d || 0,
            percent_1d: changes.percent_1d || 0
          }
        };
      });

      console.log(`✅ Zerion: Found ${assets.length} assets, total value: $${totalValue.toFixed(2)}`);

      return {
        wallet_address: walletAddress,
        chain: chain,
        total_value: totalValue,
        pnl_percentage: pnlPercentage,
        assets: assets,
        snapshot_timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Zerion API error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Zerion API key. Please check your ZERION_API_KEY in .env');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Wallet not found or no positions on ${chain}`);
      }
      
      throw new Error(`Failed to fetch portfolio: ${error.message}`);
    }
  }

  /**
   * Get chart data (optional, for future features)
   */
  async getChartData(
    walletAddress: string, 
    period: 'day' | 'week' | 'month' | 'year' = 'day'
  ) {
    try {
      const response = await this.client.get(
        `/wallets/${walletAddress}/charts/${period}`,
        {
          params: {
            'currency': 'usd'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Zerion chart error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Health check - verify API key works
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a known wallet to verify credentials
      await this.client.get('/wallets/CDSjb7bgX388TMZ7T2LPgEz6J6vbA9B5ugF8qLnRgk8N/portfolio', {
        params: { 'currency': 'usd' }
      });
      return true;
    } catch (error) {
      console.error('Zerion health check failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let zerionClient: ZerionClient | null = null;

export function getZerionClient(): ZerionClient {
  if (!zerionClient) {
    const apiKey = process.env.ZERION_API_KEY;
    if (!apiKey || apiKey === 'your_zerion_api_key_here') {
      throw new Error('ZERION_API_KEY not set in environment variables');
    }
    zerionClient = new ZerionClient(apiKey);
  }
  return zerionClient;
}

export default ZerionClient;
