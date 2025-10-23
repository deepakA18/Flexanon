# FlexAnon Test Frontend

Minimal frontend to test wallet integration and link generation.

## Setup

```bash
cd frontend-test
npm install
npm start
```

Frontend will run on http://localhost:3000

## Prerequisites

1. **Backend running** on http://localhost:3001
2. **Phantom Wallet** installed (browser extension)
3. **Phantom switched to Devnet**
4. **Wallet funded** with devnet SOL (at least 0.01 SOL)

## How to Test

### Step 1: Setup Phantom for Devnet

1. Open Phantom wallet extension
2. Click settings (gear icon)
3. Scroll to "Developer Settings"
4. Change "Network" to "Devnet"
5. Get devnet SOL: `solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet`

### Step 2: Test the Flow

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Approve connection in Phantom
4. Click "Generate Share Link"
5. Approve signature in Phantom (twice)
6. Copy the generated link

### What Happens

1. **Connect Wallet**: Connects to Phantom wallet
2. **Generate Link**:
   - Creates and signs commitment message
   - Submits to relayer (privacy-preserving)
   - Relayer creates on-chain commitment
   - Generates shareable link
   - Link includes privacy preferences

### Privacy Test

- Check transaction on Solana Explorer
- Fee payer = Relayer wallet (not your wallet!)
- Your wallet is NOT visible on blockchain

### Expected Result

```
✅ Wallet connected
✅ Commitment submitted via relayer
✅ Share link generated
✅ Link format: http://localhost:3000/s/TOKEN_ID
```

## Troubleshooting

**"Phantom wallet not found"**
- Install Phantom browser extension
- Refresh the page

**"Insufficient balance"**
- Fund wallet: `solana airdrop 1 YOUR_ADDRESS --url devnet`
- Check balance: `solana balance YOUR_ADDRESS --url devnet`

**"Relayer service unavailable"**
- Check backend is running
- Verify relayer has balance: `curl http://localhost:3001/api/relayer/status`

**"Failed to generate link"**
- Check backend logs
- Verify CORS is enabled
- Ensure wallet is on devnet

## Notes

- This is a minimal test frontend
- Production frontend should handle errors better
- Portfolio data comes from mainnet (via Zerion)
- Commitments go to devnet
- Same wallet address works on both networks
