import crypto from 'crypto';

/**
 * Simple Sparse Merkle Tree implementation
 * Each leaf is a key-value pair where both are hashed
 * Tree is built bottom-up, with empty leaves defaulting to a special hash
 */

export interface SMTLeaf {
  key: string;
  value: string;
}

export interface SMTProof {
  siblings: string[];
  path: number[]; // 0 = left, 1 = right
}

export class SparseMerkleTree {
  private leaves: Map<string, string>;
  private nodes: Map<string, string>;
  private root: string;
  private readonly TREE_DEPTH = 256; // SHA-256 gives us 256 bits
  private readonly EMPTY_HASH: string;

  constructor(leaves: SMTLeaf[]) {
    this.EMPTY_HASH = this.hash('EMPTY_LEAF');
    this.leaves = new Map();
    this.nodes = new Map();

    // Add all leaves
    leaves.forEach(({ key, value }) => {
      this.leaves.set(key, value);
    });

    // Build the tree
    this.root = this.buildTree();
  }

  /**
   * Hash function (SHA-256)
   */
  private hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create leaf hash from key and value
   */
  private leafHash(key: string, value: string): string {
    return this.hash(`${key}:${value}`);
  }

  /**
   * Build the Sparse Merkle Tree bottom-up
   */
  private buildTree(): string {
    // Start with leaf level
    const leafLevel = new Map<string, string>();

    // Insert all leaves at their bit positions
    this.leaves.forEach((value, key) => {
      const leafHash = this.leafHash(key, value);
      leafLevel.set(key, leafHash);
    });

    // Build tree level by level
    let currentLevel = leafLevel;

    for (let depth = this.TREE_DEPTH - 1; depth >= 0; depth--) {
      const nextLevel = new Map<string, string>();
      const processedParents = new Set<string>();

      currentLevel.forEach((hash, bitPath) => {
        if (bitPath.length === 0) {
          // We've reached the root
          return;
        }

        // Get parent's bit path (remove last bit)
        const parentPath = bitPath.slice(0, -1);

        if (processedParents.has(parentPath)) {
          return;
        }

        processedParents.add(parentPath);

        // Get left and right children
        const leftPath = parentPath + '0';
        const rightPath = parentPath + '1';

        const leftChild = currentLevel.get(leftPath) || this.EMPTY_HASH;
        const rightChild = currentLevel.get(rightPath) || this.EMPTY_HASH;

        // Parent hash = hash(leftChild + rightChild)
        const parentHash = this.hash(leftChild + rightChild);

        nextLevel.set(parentPath, parentHash);
        this.nodes.set(parentPath, parentHash);
      });

      currentLevel = nextLevel;
    }

    // The root is at bit path ''
    return currentLevel.get('') || this.EMPTY_HASH;
  }

  /**
   * Get the Merkle root
   */
  getRoot(): string {
    return this.root;
  }

  /**
   * Generate Merkle proof for a specific leaf
   */
  getProof(leafKey: string): SMTProof {
    if (!this.leaves.has(leafKey)) {
      throw new Error(`Leaf with key ${leafKey} not found in tree`);
    }

    const siblings: string[] = [];
    const path: number[] = [];

    let currentPath = leafKey;

    // Traverse from leaf to root
    for (let i = currentPath.length - 1; i >= 0; i--) {
      const isRightChild = currentPath[i] === '1';
      path.unshift(isRightChild ? 1 : 0);

      // Get sibling
      const siblingPath = currentPath.slice(0, i) + (isRightChild ? '0' : '1') + currentPath.slice(i + 1);
      const siblingHash = this.nodes.get(siblingPath) || this.EMPTY_HASH;

      siblings.unshift(siblingHash);
    }

    return { siblings, path };
  }

  /**
   * Verify a Merkle proof
   */
  static verify(
    root: string,
    leaf: SMTLeaf,
    proof: SMTProof
  ): boolean {
    const hash = (data: string) => crypto.createHash('sha256').update(data).digest('hex');
    const leafHash = (key: string, value: string) => hash(`${key}:${value}`);

    let currentHash = leafHash(leaf.key, leaf.value);

    // Traverse up the tree
    for (let i = 0; i < proof.siblings.length; i++) {
      const sibling = proof.siblings[i];
      const isRight = proof.path[i] === 1;

      if (isRight) {
        // Current node is right child
        currentHash = hash(sibling + currentHash);
      } else {
        // Current node is left child
        currentHash = hash(currentHash + sibling);
      }
    }

    return currentHash === root;
  }

  /**
   * Get all leaves (for debugging)
   */
  getLeaves(): Map<string, string> {
    return new Map(this.leaves);
  }

  /**
   * Convert bit path to binary string for display
   */
  private toBinaryPath(key: string, length: number = 256): string {
    // Convert hash to binary
    const buffer = Buffer.from(key, 'hex');
    let binary = '';
    for (let i = 0; i < buffer.length && binary.length < length; i++) {
      binary += buffer[i].toString(2).padStart(8, '0');
    }
    return binary.slice(0, length);
  }
}

/**
 * Helper function to create a leaf key (deterministic hash of identifier)
 */
export function createLeafKey(identifier: string): string {
  return crypto.createHash('sha256').update(identifier).digest('hex');
}

/**
 * Helper function to create a leaf value (hash of data)
 */
export function createLeafValue(data: any): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

export default SparseMerkleTree;
