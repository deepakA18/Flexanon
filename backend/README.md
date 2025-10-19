# Flexanon Backend

Privacy-first portfolio sharing with Sparse Merkle Tree proofs.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- Zerion API key ([Get one here](https://zerion-io.typeform.com/to/QI3GRa7t?utm_source=cypherpunk))

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001
BASE_URL=http://localhost:3000

# Database (use Supabase or local Postgres)
DATABASE_URL=postgresql://user:password@localhost:5432/flexanon

# Zerion API
ZERION_API_KEY=your_zerion_api_key_here
ZERION_API_URL=https://api.zerion.io

# Security
JWT_SECRET=your_random_jwt_secret_32_chars_min
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Database Setup

**Option 1: Local PostgreSQL**

```bash
# Create database
createdb flexanon

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://localhost:5432/flexanon
```

**Option 2: Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Update DATABASE_URL in .env

### Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### Authentication

#### Generate Nonce
```bash
POST /api/auth/nonce
Content-Type: application/json

{
  "wallet_address": "0x..."
}

Response:
{
  "message": "Flexanon Verification\n\nNonce: ...",
  "nonce": "abc123...",
  "timestamp": 1705334400000,
  "expires_at": "2025-01-15T10:35:00Z"
}
```

#### Verify Signature
```bash
POST /api/auth/verify
Content-Type: application/json

{
  "wallet_address": "0x...",
  "signature": "0x...",
  "chain": "solana"
}

Response:
{
  "success": true,
  "session_token": "xyz789...",
  "wallet_address": "0x...",
  "expires_at": "2025-01-16T10:30:00Z"
}
```

### Share Links

#### Generate Share Link (Auth Required)
```bash
POST /api/share/generate
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "chain": "solana",
  "reveal_preferences": {
    "show_total_value": true,
    "show_pnl": true,
    "show_top_assets": true,
    "top_assets_count": 3,
    "show_all_assets": false,
    "show_wallet_address": false,
    "show_snapshot_time": true
  },
  "expiry_days": 30
}

Response:
{
  "success": true,
  "share_url": "http://localhost:3000/s/a3k9m2x1",
  "token_id": "a3k9m2x1",
  "merkle_root": "0x7f3e...",
  "revealed_count": 5,
  "hidden_count": 12,
  "privacy_score": 71,
  "expires_at": "2025-02-14T10:30:00Z"
}
```

#### Resolve Share Link (Public)
```bash
GET /api/share/resolve?token=a3k9m2x1

Response:
{
  "token_id": "a3k9m2x1",
  "merkle_root": "0x7f3e...",
  "committed_at": "2025-01-15T10:30:00Z",
  "revealed_data": {
    "total_value": "$50,000.00",
    "pnl_percentage": "+143.25%",
    "top_assets": [
      {
        "symbol": "SOL",
        "amount": "10.5",
        "value_usd": "2,100.00",
        "icon_url": "https://..."
      }
    ],
    "snapshot_time": "2025-01-15T10:30:00Z"
  },
  "proof_data": [...],
  "verification_status": "unknown",
  "privacy": {
    "wallet_address": "hidden",
    "total_assets_count": 17,
    "revealed_count": 5
  }
}
```

#### Verify Merkle Proof (Public)
```bash
POST /api/share/verify
Content-Type: application/json

{
  "merkle_root": "0x7f3e...",
  "revealed_item": {
    "key": "hash123...",
    "value": "hash456...",
    "label": "total_value"
  },
  "proof": {
    "siblings": ["0xabc...", "0xdef..."],
    "path": [0, 1, 0, 1]
  }
}

Response:
{
  "valid": true,
  "merkle_root": "0x7f3e...",
  "item_label": "total_value",
  "message": "Item verified against committed Merkle root"
}
```

#### Revoke Share Link (Auth Required)
```bash
POST /api/share/revoke
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "token_id": "a3k9m2x1"
}

Response:
{
  "success": true,
  "message": "Share token revoked successfully"
}
```

#### Get My Tokens (Auth Required)
```bash
GET /api/share/my-tokens
Authorization: Bearer <session_token>

Response:
{
  "tokens": [
    {
      "token_id": "a3k9m2x1",
      "merkle_root": "0x7f3e...",
      "created_at": "2025-01-15T10:30:00Z",
      "expires_at": "2025-02-14T10:30:00Z",
      "revoked": false,
      "revealed_count": 5,
      "privacy_score": 71,
      "share_url": "http://localhost:3000/s/a3k9m2x1"
    }
  ],
  "total": 1
}
```

## 🔐 How Privacy Works

### Sparse Merkle Tree (SMT) Structure

1. **Portfolio → Merkle Leaves**
   - Each data point becomes a leaf (wallet address, total value, each asset, etc.)
   - Leaf = `{ key: hash(identifier), value: hash(data) }`

2. **Selective Disclosure**
   - User chooses which leaves to reveal publicly
   - Hidden leaves stay in tree but data is not shared

3. **Merkle Root Commitment**
   - All leaves are committed to a single Merkle root
   - Root is stored publicly and cannot be changed

4. **Verification**
   - Anyone can verify revealed data against the root
   - Impossible to fake data after commitment
   - Hidden data remains cryptographically protected

### Example Tree Structure

```
                    ROOT (committed publicly)
                   /                          \
              Node A                          Node B
             /      \                        /      \
        Leaf 1    Leaf 2                Leaf 3    Leaf 4
      (wallet)   (total $)              (SOL)    (ETH)
      [HIDDEN]   [REVEALED]           [REVEALED] [HIDDEN]
```

## 🧪 Testing

### Test with cURL

1. **Get nonce**
```bash
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"your_wallet_here"}'
```

2. **Sign the message with your wallet** (use MetaMask or Phantom)

3. **Verify signature**
```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address":"your_wallet_here",
    "signature":"your_signature_here",
    "chain":"solana"
  }'
```

4. **Generate share link**
```bash
curl -X POST http://localhost:3001/api/share/generate \
  -H "Authorization: Bearer your_session_token" \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "solana",
    "reveal_preferences": {
      "show_total_value": true,
      "show_pnl": true,
      "show_top_assets": true,
      "top_assets_count": 3
    }
  }'
```

## 📦 Project Structure

```
src/
├── config/
│   └── database.ts          # PostgreSQL connection
├── lib/
│   ├── merkle.ts            # Sparse Merkle Tree implementation
│   ├── zerion.ts            # Zerion API client
│   ├── crypto.ts            # Hashing & encryption utilities
│   └── signature.ts         # EVM & Solana signature verification
├── routes/
│   ├── auth.ts              # Authentication endpoints
│   └── share.ts             # Share link endpoints
├── services/
│   ├── portfolio.ts         # Portfolio → Merkle leaves conversion
│   └── share.ts             # Share token management
├── types/
│   └── index.ts             # TypeScript types
└── server.ts                # Express app
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase recommended)
- **Privacy**: Sparse Merkle Trees (custom implementation)
- **Wallet Auth**: EVM (ethers.js) + Solana (tweetnacl)
- **Portfolio Data**: Zerion API

## 📝 License

MIT

## 🤝 Contributing

PRs welcome for the hackathon!
