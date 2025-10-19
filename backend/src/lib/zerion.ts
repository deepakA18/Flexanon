import axios, { AxiosInstance } from 'axios';
import { ZerionPortfolio, ZerionAsset } from '../types';

/**
 * Zerion API Client
 * Docs: https://developers.zerion.io/reference/intro-getting-started
 */

export class ZerionClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: process.env.ZERION_API_URL || 'https://api.zerion.io',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Fetch wallet portfolio
   * https://developers.zerion.io/reference/walletspositions
   */
  async getPortfolio(walletAddress: string, chain: string = 'solana'): Promise<ZerionPortfolio> {
    try {
      // Normalize chain name for Zerion API
      const chainId = this.normalizeChain(chain);

      // Fetch positions (assets held)
      const positionsResponse = await this.client.get(
        `/v1/wallets/${walletAddress}/positions/`,
        {
          params: {
            'filter[chain_ids]': chainId,
            'currency': 'usd',
            'sort': 'value'
          }
        }
      );

      const positions = positionsResponse.data.data || [];

      // Fetch portfolio stats
      const portfolioResponse = await this.client.get(
        `/v1/wallets/${walletAddress}/portfolio/`,
        {
          params: {
            'currency': 'usd',
            'filter[chain_ids]': chainId
          }
        }
      );

      const portfolioData = portfolioResponse.data.data?.attributes || {};

      // Parse assets
      const assets: ZerionAsset[] = positions.map((position: any) => {
        const attributes = position.attributes || {};
        const fungible = attributes.fungible_info || {};
        const quantity = attributes.quantity?.numeric || '0';
        const value = attributes.value || 0;
        const price = attributes.price || 0;

        return {
          asset_code: fungible.implementations?.[0]?.address || 'unknown',
          symbol: fungible.symbol || 'UNKNOWN',
          name: fungible.name || 'Unknown Asset',
          quantity,
          price,
          value,
          icon_url: fungible.icon?.url
        };
      });

      // Calculate total value and PnL
      const totalValue = portfolioData.total?.value || 0;
      const totalCost = portfolioData.total_cost || totalValue;
      const pnlPercentage = totalCost > 0 
        ? ((totalValue - totalCost) / totalCost) * 100 
        : 0;

      return {
        wallet_address: walletAddress,
        chain: chain,
        total_value: totalValue,
        pnl_percentage: pnlPercentage,
        assets: assets.sort((a, b) => b.value - a.value), // Sort by value descending
        snapshot_timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Zerion API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch portfolio: ${error.message}`);
    }
  }

  /**
   * Get transaction history (optional, for future features)
   */
  async getTransactions(walletAddress: string, chain: string = 'solana', limit: number = 50) {
    try {
      const chainId = this.normalizeChain(chain);

      const response = await this.client.get(
        `/v1/wallets/${walletAddress}/transactions/`,
        {
          params: {
            'filter[chain_ids]': chainId,
            'page[size]': limit
          }
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Zerion API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Normalize chain names to Zerion chain IDs
   * https://developers.zerion.io/reference/supported-chains
   */
  private normalizeChain(chain: string): string {
    const chainMap: Record<string, string> = {
      'solana': 'solana',
      'ethereum': 'ethereum',
      'eth': 'ethereum',
      'polygon': 'polygon',
      'matic': 'polygon',
      'base': 'base',
      'arbitrum': 'arbitrum',
      'optimism': 'optimism',
      'avalanche': 'avalanche',
      'bsc': 'binance-smart-chain',
      'binance': 'binance-smart-chain'
    };

    return chainMap[chain.toLowerCase()] || chain.toLowerCase();
  }

  /**
   * Health check - verify API key works
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Make a simple request to verify credentials
      await this.client.get('/v1/chains');
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
    if (!apiKey) {
      throw new Error('ZERION_API_KEY not set in environment variables');
    }
    zerionClient = new ZerionClient(apiKey);
  }
  return zerionClient;
}

export default ZerionClient;
