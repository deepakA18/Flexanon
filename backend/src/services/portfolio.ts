import { ZerionPortfolio, MerkleLeaf, RevealPreferences } from '../types';
import { createLeafKey, createLeafValue } from '../lib/merkle';

/**
 * Portfolio service - converts Zerion portfolio into Merkle leaves
 */

export interface PortfolioLeaves {
  all: MerkleLeaf[];
  revealed: MerkleLeaf[];
  hidden: MerkleLeaf[];
}

/**
 * Build Merkle leaves from portfolio data
 */
export function buildPortfolioLeaves(
  portfolio: ZerionPortfolio,
  walletAddress: string
): MerkleLeaf[] {
  const leaves: MerkleLeaf[] = [];

  // 1. Wallet address (always a leaf, usually hidden)
  leaves.push({
    key: createLeafKey('wallet_address'),
    value: createLeafValue(walletAddress.toLowerCase()),
    data: { wallet_address: walletAddress.toLowerCase() },
    label: 'wallet_address'
  });

  // 2. Chain
  leaves.push({
    key: createLeafKey('chain'),
    value: createLeafValue(portfolio.chain),
    data: { chain: portfolio.chain },
    label: 'chain'
  });

  // 3. Total value
  leaves.push({
    key: createLeafKey('total_value'),
    value: createLeafValue(portfolio.total_value.toString()),
    data: { total_value: portfolio.total_value },
    label: 'total_value'
  });

  // 4. PnL percentage
  leaves.push({
    key: createLeafKey('pnl_percentage'),
    value: createLeafValue(portfolio.pnl_percentage.toString()),
    data: { pnl_percentage: portfolio.pnl_percentage },
    label: 'pnl_percentage'
  });

  // 5. Snapshot timestamp
  leaves.push({
    key: createLeafKey('snapshot_timestamp'),
    value: createLeafValue(portfolio.snapshot_timestamp.toString()),
    data: { snapshot_timestamp: portfolio.snapshot_timestamp },
    label: 'snapshot_timestamp'
  });

  // 6. Total assets count
  leaves.push({
    key: createLeafKey('total_assets_count'),
    value: createLeafValue(portfolio.assets.length.toString()),
    data: { total_assets_count: portfolio.assets.length },
    label: 'total_assets_count'
  });

  // 7. Individual assets
  portfolio.assets.forEach((asset, index) => {
    // Each asset gets its own leaf
    const assetData = {
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity,
      price: asset.price,
      value: asset.value,
      icon_url: asset.icon_url
    };

    leaves.push({
      key: createLeafKey(`asset_${index}_${asset.symbol}`),
      value: createLeafValue(JSON.stringify(assetData)),
      data: assetData,
      label: `asset_${index}_${asset.symbol}`
    });
  });

  return leaves;
}

/**
 * Select which leaves to reveal based on user preferences
 */
export function selectLeavesToReveal(
  allLeaves: MerkleLeaf[],
  preferences: RevealPreferences
): PortfolioLeaves {
  const revealed: MerkleLeaf[] = [];
  const hidden: MerkleLeaf[] = [];

  allLeaves.forEach((leaf) => {
    let shouldReveal = false;

    switch (leaf.label) {
      case 'wallet_address':
        shouldReveal = preferences.show_wallet_address;
        break;

      case 'chain':
        shouldReveal = true; // Always reveal chain
        break;

      case 'total_value':
        shouldReveal = preferences.show_total_value;
        break;

      case 'pnl_percentage':
        shouldReveal = preferences.show_pnl;
        break;

      case 'snapshot_timestamp':
        shouldReveal = preferences.show_snapshot_time;
        break;

      case 'total_assets_count':
        shouldReveal = true; // Always reveal total count
        break;

      default:
        // Handle assets
        if (leaf.label?.startsWith('asset_')) {
          if (preferences.show_all_assets) {
            shouldReveal = true;
          } else if (preferences.show_top_assets) {
            // Extract asset index
            const indexMatch = leaf.label.match(/^asset_(\d+)_/);
            if (indexMatch) {
              const assetIndex = parseInt(indexMatch[1]);
              shouldReveal = assetIndex < preferences.top_assets_count;
            }
          }
        }
    }

    if (shouldReveal) {
      revealed.push(leaf);
    } else {
      // Hide the actual data for hidden leaves
      hidden.push({
        key: leaf.key,
        value: leaf.value,
        label: leaf.label
        // No 'data' field for hidden leaves
      });
    }
  });

  return {
    all: allLeaves,
    revealed,
    hidden
  };
}

/**
 * Format portfolio data for public display
 */
export function formatPublicPortfolioData(revealedLeaves: MerkleLeaf[]) {
  const data: any = {};

  revealedLeaves.forEach((leaf) => {
    if (!leaf.data) return;

    switch (leaf.label) {
      case 'wallet_address':
        data.wallet_address = leaf.data.wallet_address;
        break;

      case 'chain':
        data.chain = leaf.data.chain;
        break;

      case 'total_value':
        data.total_value = `$${leaf.data.total_value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        break;

      case 'pnl_percentage':
        const pnl = leaf.data.pnl_percentage;
        data.pnl_percentage = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`;
        break;

      case 'snapshot_timestamp':
        data.snapshot_time = new Date(leaf.data.snapshot_timestamp).toISOString();
        break;

      case 'total_assets_count':
        data.total_assets_count = leaf.data.total_assets_count;
        break;

      default:
        // Handle assets
        if (leaf.label?.startsWith('asset_')) {
          if (!data.top_assets) {
            data.top_assets = [];
          }
          data.top_assets.push({
            symbol: leaf.data.symbol,
            name: leaf.data.name,
            amount: leaf.data.quantity,
            value_usd: leaf.data.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
            icon_url: leaf.data.icon_url
          });
        }
    }
  });

  return data;
}

/**
 * Calculate privacy score (how much is hidden)
 */
export function calculatePrivacyScore(
  revealedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  const hiddenPercentage = ((totalCount - revealedCount) / totalCount) * 100;
  return Math.round(hiddenPercentage);
}

export default {
  buildPortfolioLeaves,
  selectLeavesToReveal,
  formatPublicPortfolioData,
  calculatePrivacyScore
};
