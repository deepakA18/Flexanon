import CryptoJS from "crypto-js";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const sha256 = (data: string): string =>
  CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);

export const base58Encode = (buffer: Uint8Array): string => {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) digits.push(0);
  return digits.reverse().map((d) => BASE58_ALPHABET[d]).join("");
};

const createLeafKey = (identifier: string): string => sha256(identifier);
const createLeafValue = (data: any): string =>
  sha256(typeof data === "string" ? data : JSON.stringify(data));

export const buildPortfolioLeaves = (portfolio: any, address: string) => {
  const leaves: Array<{ key: string; value: string }> = [];
  leaves.push({
    key: createLeafKey("wallet_address"),
    value: createLeafValue(address.toLowerCase()),
  });
  leaves.push({
    key: createLeafKey("chain"),
    value: createLeafValue(portfolio.chain),
  });
  leaves.push({
    key: createLeafKey("total_value"),
    value: createLeafValue(portfolio.total_value.toString()),
  });
  leaves.push({
    key: createLeafKey("pnl_percentage"),
    value: createLeafValue(portfolio.pnl_percentage.toString()),
  });
  leaves.push({
    key: createLeafKey("snapshot_timestamp"),
    value: createLeafValue(portfolio.snapshot_timestamp.toString()),
  });
  leaves.push({
    key: createLeafKey("total_assets_count"),
    value: createLeafValue(portfolio.assets.length.toString()),
  });

  portfolio.assets.forEach((asset: any, index: number) => {
    leaves.push({
      key: createLeafKey(`asset_${index}_${asset.symbol}`),
      value: createLeafValue(asset),
    });
  });

  return leaves;
};

export const buildSparseMerkleTree = (leaves: Array<{ key: string; value: string }>) => {
  const EMPTY_HASH = sha256("EMPTY_LEAF");
  const TREE_DEPTH = 256;
  const leafLevel = new Map<string, string>();
  leaves.forEach((leaf) => {
    const leafHash = sha256(leaf.key + ":" + leaf.value);
    leafLevel.set(leaf.key, leafHash);
  });

  let currentLevel = leafLevel;
  for (let depth = TREE_DEPTH - 1; depth >= 0; depth--) {
    const nextLevel = new Map<string, string>();
    const parents = new Set<string>();
    currentLevel.forEach((hash, path) => {
      if (path.length === 0) return;
      const parent = path.slice(0, -1);
      if (parents.has(parent)) return;
      parents.add(parent);

      const leftPath = parent + "0";
      const rightPath = parent + "1";
      const leftChild = currentLevel.get(leftPath) || EMPTY_HASH;
      const rightChild = currentLevel.get(rightPath) || EMPTY_HASH;
      nextLevel.set(parent, sha256(leftChild + rightChild));
    });
    currentLevel = nextLevel;
  }
  return currentLevel.get("") || EMPTY_HASH;
};
