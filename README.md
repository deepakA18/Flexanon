# FlexAnon

**Privacy-First Portfolio Sharing on Solana**

FlexAnon enables users to share their DeFi portfolio with cryptographic proof while maintaining privacy. Built on Solana powered by Zerion.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://flexanon-delta.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-blueviolet)](https://solscan.io)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Table of Contents

- [Description](#description)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Smart Contract](#smart-contract)
- [How It Works](#how-it-works)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---


## Description

FlexAnon provides **Data disclosure with cryptographic proof**:

- Prove authenticity with on-chain commitments on Solana
- Maintain privacy by never exposing your wallet address
- Generate verifiable share links powered by Merkle proofs

---

## Key Features

### Privacy-Preserving
- Data disclosure using Merkle trees
- Wallet address remains hidden
- On-chain commitments via relayer 
- User wallet never directly touches the blockchain

### Verifiable
- Cryptographic proofs stored on Solana
- Tamper-proof commitment hashing
- Version tracking for portfolio updates
- Public verification of shared data

### Developer-Friendly
- RESTful API for portfolio data
- Real-time updates via Zerion API
- Support for 35+ blockchain networks
- Comprehensive documentation

### User Experience
- Shareable links
- Real-time balance charts and analytics

---

## Architecture

FlexAnon uses a hybrid architecture combining on-chain security with off-chain performance:

```

```

### Components

**Frontend**: NextJS application with Solana Web3.js integration
**Backend**: Express.js API server with Zerion integration
**Solana Program**: Anchor solana programs for commitment storage
**Database**: PostgreSQL (Supabase) for share links and metadata
**Relayer**: Rent abstraction layer for privacy

---

## Technical Stack

### Blockchain
- **Solana**: On-chain commitment storage
- **Anchor Framework**: Smart contract development
- **Phantom Wallet**: User authentication

### Backend
- **Node.js**: Runtime environment
- **Express.js**: API framework
- **TypeScript**: Type safety
- **PostgreSQL**: Database (Supabase)

### External APIs
- **Zerion API**: Real-time portfolio data
  - Portfolio balances
  - Historical charts
  - Asset positions across 35+ chains

### Frontend
- **React**: User interface
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

### Cryptography
- **Merkle Trees**: Privacy-preserving proofs
- **SHA-256**: Hashing algorithm
- **Ed25519**: Wallet signatures

---

## Getting Started

### Prerequisites

```bash
Node.js >= 18.x
pnpm >= 8.x
Solana CLI >= 1.18.x
Anchor CLI >= 0.30.x
PostgreSQL >= 14.x
```

### Environment Variables

Create `.env` files in both `frontend` and `backend` directories:

**Backend `.env`:**
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/flexanon

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_PROGRAM_ID=PROGRAM_ID

# Relayer (base58 encoded private key)
RELAYER_PRIVATE_KEY=your_base58_private_key

# Zerion API
ZERION_API_KEY=your_zerion_api_key

# Server
PORT=3001
NODE_ENV=production
```

**Frontend `.env`:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_PROGRAM_ID=PROGRAM_ID
```

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/deepakA18/Flexanon.git
cd Flexanon
```

#### 2. Install dependencies
```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install

# Solana Program
cd ../solana-programs
pnpm install
```

#### 3. Build Solana Program
```bash
cd solana-programs
anchor build
anchor deploy
```

#### 4. Setup Database
```bash
cd ../backend
pnpm run db:setup
```

#### 5. Run Development Servers

**Backend:**
```bash
cd backend
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm start
```

---

## API Documentation

### Base URL
```
Production: https://flexanon-delta.vercel.app/api
Development: http://localhost:3001/api
```

### Endpoints

#### Portfolio Data

**Get Portfolio Summary**
```http
POST /dev/test-zerion
Content-Type: application/json

{
  "wallet_address": "WALLET_ADDRESS"
}
```

**Get Balance Chart**
```http
GET /dev/wallet-chart/:wallet_address?period=day
```

Parameters:
- `period`: `day` | `week` | `month` | `year`

**Get Asset Positions**
```http
GET /dev/wallet-positions/:wallet_address?chain=solana
```

#### Share Links

**Generate Share Link**
```http
POST /share/generate
Content-Type: application/json

{
  "wallet_address": "string",
  "commitment_address": "string",
  "commitment_version": number,
  "chain": "solana",
  "reveal_preferences": {
    "show_total_value": boolean,
    "show_pnl": boolean,
    "show_top_assets": boolean,
    "top_assets_count": number,
    "show_wallet_address": boolean
  }
}
```

**View Shared Portfolio**
```http
GET /share/:token_id
```

#### Relayer

**Commit Merkle Root**
```http
POST /relayer/commit
Content-Type: application/json

{
  "userWallet": "string",
  "merkleRoot": number[],
  "metadata": {
    "chain": "solana",
    "snapshotTimestamp": number,
    "expiresAt": number | null,
    "privacyScore": number
  },
  "userSignature": "string",
  "message": "string",
  "timestamp": number
}
```

#### Subscription

**Get Status**
```http
GET /subscription/status?wallet=string
```

**Get Plans**
```http
GET /subscription/plans
```

---

## Smart Contract

The Solana program is built with Anchor Framework and handles commitment storage.

### Program ID
```
79WokvRaKKnw4Ay73s6HGMn9ZJVcxBmsufEGH8imxTAn
```

### Instructions

**commit_root**
Stores a Merkle root commitment on-chain.

```rust
pub fn commit_root(
    ctx: Context<CommitRoot>,
    user_wallet: Pubkey,
    merkle_root: [u8; 32],
    metadata: CommitMetadata,
) -> Result<()>
```

**revoke_all**
Revokes all share links for a wallet.

```rust
pub fn revoke_all(ctx: Context<RevokeAll>) -> Result<()>
```

### Account Structure

**ShareCommitment**
```rust
pub struct ShareCommitment {
    pub relayer: Pubkey,           // 32 bytes
    pub merkle_root: [u8; 32],   // 32 bytes
    pub version: u32,            // 4 bytes
    pub metadata: CommitMetadata,
    pub timestamp: i64,          // 8 bytes
    pub revoked: bool,           // 1 byte
    pub bump: u8,                // 1 byte
}
```

---

## How It Works

### 1. Portfolio Fetching
User connects Solana wallet, and FlexAnon fetches real-time portfolio data from Zerion Solana API.

### 2. Privacy Selection
User chooses what to reveal:
- Total portfolio value
- Profit/Loss percentage
- Top N assets
- Individual asset details
- Wallet address (optional)

### 3. Merkle Tree Construction
Portfolio data is converted into Merkle leaves. Each data point becomes a leaf that can be independently revealed or hidden.

```
Example Leaves:
- wallet_address: hash(wallet_address)
- total_value: hash(total_value)
- asset_0_SOL: hash(SOL_data)
- asset_1_USDC: hash(USDC_data)
```

### 4. On-Chain Commitment
The Merkle root is committed to Solana via a relayer wallet. This ensures:
- User's wallet never appears on-chain
- Commitment is tamper-proof
- Version tracking for updates

### 5. Share Link Generation
A unique share token is created containing:
- Token ID (short, shareable)
- Revealed leaves (what user chose to share)
- Merkle proofs (for verification)
- Commitment address (Solana PDA)

### 6. Verification
Anyone with the share link can:
- View revealed data
- Verify Merkle proofs against on-chain commitment
- Confirm data authenticity without seeing hidden information

---

### Best Practices
- Never share your private keys
- Verify all transactions before signing
- Use hardware wallets for large holdings
- Review revealed data before generating share links

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **Zerion** for portfolio data API
- **Anchor Framework** for smart contract development

---

## Links

- **Website**: [flexanon.vercel.app](https://flexanon.vercel.app)
- **Documentation**: [docs.flexanon.xyz](https://github.com/deepakA18/Flexanon/wiki)
- **Twitter**: [@FlexAnon](https://x.com.com/flexAnon)
