import SparseMerkleTree, { createLeafKey, createLeafValue } from '../src/lib/merkle';

/**
 * Test Sparse Merkle Tree implementation
 */

console.log('🧪 Testing Sparse Merkle Tree Implementation\n');

// Create sample portfolio leaves
const leaves = [
  {
    key: createLeafKey('wallet_address'),
    value: createLeafValue('0x1234567890abcdef')
  },
  {
    key: createLeafKey('total_value'),
    value: createLeafValue('50000')
  },
  {
    key: createLeafKey('pnl_percentage'),
    value: createLeafValue('143.5')
  },
  {
    key: createLeafKey('asset_0_SOL'),
    value: createLeafValue(JSON.stringify({ symbol: 'SOL', amount: '10.5' }))
  },
  {
    key: createLeafKey('asset_1_ETH'),
    value: createLeafValue(JSON.stringify({ symbol: 'ETH', amount: '2.3' }))
  }
];

console.log(`📊 Created ${leaves.length} sample leaves`);
console.log('');

// Build tree
console.log('🌳 Building Sparse Merkle Tree...');
const smt = new SparseMerkleTree(leaves);
const root = smt.getRoot();

console.log(`✅ Merkle root: ${root}`);
console.log('');

// Generate proof for first leaf
console.log('🔐 Generating proof for "total_value" leaf...');
const testLeaf = leaves[1]; // total_value
const proof = smt.getProof(testLeaf.key);

console.log(`   Leaf key: ${testLeaf.key.slice(0, 16)}...`);
console.log(`   Leaf value: ${testLeaf.value.slice(0, 16)}...`);
console.log(`   Proof siblings: ${proof.siblings.length}`);
console.log(`   Proof path: ${proof.path.slice(0, 10).join(', ')}...`);
console.log('');

// Verify proof
console.log('✓ Verifying proof...');
const isValid = SparseMerkleTree.verify(root, testLeaf, proof);

if (isValid) {
  console.log('✅ Proof is VALID!');
  console.log('   The revealed data is authentic and part of the committed portfolio.');
} else {
  console.log('❌ Proof is INVALID!');
  console.log('   Something went wrong.');
}
console.log('');

// Test with tampered data
console.log('🔒 Testing with tampered data...');
const tamperedLeaf = {
  key: testLeaf.key,
  value: createLeafValue('999999') // Different value
};

const tamperedValid = SparseMerkleTree.verify(root, tamperedLeaf, proof);

if (!tamperedValid) {
  console.log('✅ Tampered data correctly REJECTED!');
  console.log('   The proof system detects data manipulation.');
} else {
  console.log('❌ WARNING: Tampered data was accepted!');
}
console.log('');

// Test all leaves
console.log('🔍 Verifying all leaves...');
let allValid = true;

leaves.forEach((leaf, index) => {
  const leafProof = smt.getProof(leaf.key);
  const valid = SparseMerkleTree.verify(root, leaf, leafProof);
  
  if (valid) {
    console.log(`   ✓ Leaf ${index + 1}/${leaves.length} verified`);
  } else {
    console.log(`   ✗ Leaf ${index + 1}/${leaves.length} FAILED`);
    allValid = false;
  }
});

console.log('');
if (allValid) {
  console.log('🎉 All tests PASSED!');
  console.log('   The Sparse Merkle Tree implementation is working correctly.');
} else {
  console.log('❌ Some tests FAILED');
}

console.log('');
console.log('================================');
console.log('Summary:');
console.log(`  Total leaves: ${leaves.length}`);
console.log(`  Merkle root length: ${root.length} chars`);
console.log(`  All proofs valid: ${allValid ? 'YES' : 'NO'}`);
console.log('================================');
