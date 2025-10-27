import CryptoJS from "crypto-js"

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

interface MerkleLeaf {
  key: string
  value: string
}

interface Asset {
  symbol: string
  name: string
  quantity: number
  price: number
  value: number
  icon_url: string
}

export interface Portfolio {
  chain: string
  total_value: number
  pnl_percentage: number
  snapshot_timestamp: number
  assets: Asset[]
}

export function base58Encode(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  const digits: number[] = [0]

  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }

    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    digits.push(0)
  }

  return digits.reverse().map(d => BASE58_ALPHABET[d]).join('')
}

export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

export function createLeafKey(identifier: string): string {
  return sha256(identifier)
}

export function createLeafValue(data: string | object): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data)
  return sha256(dataString)
}

export function buildPortfolioLeaves(portfolio: Portfolio, walletAddress: string): MerkleLeaf[] {
  const leaves: MerkleLeaf[] = []

  leaves.push({
    key: createLeafKey('wallet_address'),
    value: createLeafValue(walletAddress.toLowerCase())
  })

  leaves.push({
    key: createLeafKey('chain'),
    value: createLeafValue(portfolio.chain)
  })

  leaves.push({
    key: createLeafKey('total_value'),
    value: createLeafValue(portfolio.total_value.toString())
  })

  leaves.push({
    key: createLeafKey('pnl_percentage'),
    value: createLeafValue(portfolio.pnl_percentage.toString())
  })

  leaves.push({
    key: createLeafKey('snapshot_timestamp'),
    value: createLeafValue(portfolio.snapshot_timestamp.toString())
  })

  leaves.push({
    key: createLeafKey('total_assets_count'),
    value: createLeafValue(portfolio.assets.length.toString())
  })

  portfolio.assets.forEach((asset, index) => {
    const assetData = {
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity,
      price: asset.price,
      value: asset.value,
      icon_url: asset.icon_url
    }

    leaves.push({
      key: createLeafKey(`asset_${index}_${asset.symbol}`),
      value: createLeafValue(JSON.stringify(assetData))
    })
  })

  return leaves
}

export function buildSparseMerkleTree(leaves: MerkleLeaf[]): string {
  const EMPTY_HASH = sha256('EMPTY_LEAF')
  const TREE_DEPTH = 256

  const leafLevel = new Map<string, string>()
  leaves.forEach(leaf => {
    const leafHash = sha256(leaf.key + ':' + leaf.value)
    leafLevel.set(leaf.key, leafHash)
  })

  let currentLevel = leafLevel

  for (let depth = TREE_DEPTH - 1; depth >= 0; depth--) {
    const nextLevel = new Map<string, string>()
    const processedParents = new Set<string>()

    currentLevel.forEach((hash, bitPath) => {
      if (bitPath.length === 0) return

      const parentPath = bitPath.slice(0, -1)
      if (processedParents.has(parentPath)) return

      processedParents.add(parentPath)

      const leftPath = parentPath + '0'
      const rightPath = parentPath + '1'
      const leftChild = currentLevel.get(leftPath) || EMPTY_HASH
      const rightChild = currentLevel.get(rightPath) || EMPTY_HASH
      const parentHash = sha256(leftChild + rightChild)

      nextLevel.set(parentPath, parentHash)
    })

    currentLevel = nextLevel
  }

  return currentLevel.get('') || EMPTY_HASH
}