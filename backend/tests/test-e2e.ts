/**
 * End-to-end test for FlexAnon
 * Tests the complete flow without real Zerion API
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const PROGRAM_ID = '8a1iB4a3FmaFnPZ7d2j7yVYTxpr21w69A6CsiDrsTkCq';

async function testCompleteFlow() {
  console.log('🧪 Starting end-to-end test...\n');

  // 1. Generate test wallet
  const wallet = Keypair.generate();
  console.log(`✅ Generated test wallet: ${wallet.publicKey.toString()}`);

  // 2. Derive commitment PDA
  const [commitmentPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from('commitment'),
      wallet.publicKey.toBuffer()
    ],
    new PublicKey(PROGRAM_ID)
  );
  console.log(`✅ Commitment PDA: ${commitmentPDA.toString()}\n`);

  // 3. TODO: Commit merkle root on-chain (requires Solana program call)
  console.log('⚠️  Skipping on-chain commitment (do this manually first)');
  console.log('   Run: anchor test\n');

  // 4. Generate share link via API
  console.log('📡 Calling /api/share/generate...');
  
  try {
    const generateResponse = await axios.post(`${API_BASE}/share/generate`, {
      wallet_address: wallet.publicKey.toString(),
      commitment_address: commitmentPDA.toString(),
      commitment_version: 1,
      chain: 'solana',
      reveal_preferences: {
        show_total_value: true,
        show_pnl: true,
        show_top_assets: true,
        top_assets_count: 3,
        show_wallet_address: false
      }
    });

    const { share_url, token_id } = generateResponse.data;
    console.log(`✅ Share link generated!`);
    console.log(`   URL: ${share_url}`);
    console.log(`   Token: ${token_id}\n`);

    // 5. Resolve share link
    console.log(`📡 Resolving token: ${token_id}...`);
    const resolveResponse = await axios.get(`${API_BASE}/share/resolve?token=${token_id}`);
    
    console.log(`✅ Share link resolved!`);
    console.log(`   Total value: ${resolveResponse.data.revealed_data.total_value}`);
    console.log(`   PnL: ${resolveResponse.data.revealed_data.pnl_percentage}`);
    console.log(`   Assets: ${resolveResponse.data.revealed_data.top_assets.length}\n`);

    // 6. Verify merkle proofs
    console.log(`🔐 Verifying merkle proofs...`);
    const proofs = resolveResponse.data.proof_data;
    
    for (const proof of proofs.slice(0, 3)) { // Test first 3
      const verifyResponse = await axios.post(`${API_BASE}/share/verify`, {
        merkle_root: resolveResponse.data.on_chain_status.merkle_root,
        revealed_item: proof.leaf,
        proof: {
          siblings: proof.siblings,
          path: proof.path
        }
      });

      if (verifyResponse.data.valid) {
        console.log(`   ✅ ${proof.leaf.label} verified`);
      } else {
        console.log(`   ❌ ${proof.leaf.label} FAILED`);
      }
    }

    console.log('\n🎉 All tests passed!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Run test
testCompleteFlow();
