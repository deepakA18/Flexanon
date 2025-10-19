# 🎯 Flexanon Backend - Implementation Summary

## What We Built

A **privacy-first portfolio sharing backend** using **Sparse Merkle Trees** for cryptographic proof of portfolio ownership without revealing wallet addresses.

## ✅ Completed Features

### 1. Core Privacy System (Sparse Merkle Trees)
- ✅ Custom SMT implementation (`src/lib/merkle.ts`)
- ✅ Leaf creation from portfolio data
- ✅ Merkle proof generation
- ✅ Proof verification (client or server-side)
- ✅ Selective disclosure (reveal only what you choose)

### 2. Wallet Authentication
- ✅ Nonce generation for signature challenges
- ✅ EVM signature verification (Ethereum, Polygon, Base, etc.)
- ✅ Solana signature verification
- ✅ Session token management
- ✅ Secure auth middleware

### 3. Zerion API Integration
- ✅ Portfolio fetching (all supported chains)
- ✅ Asset data parsing
- ✅ PnL calculation
- ✅ Error handling and retries

### 4. Share Link System
- ✅ Generate share tokens with custom privacy settings
- ✅ Public resolution endpoint (no auth required)
- ✅ Token expiry system
- ✅ Revocation mechanism
- ✅ View analytics tracking

### 5. Database Layer
- ✅ PostgreSQL schema design
- ✅ Share tokens table
- ✅ Session management
- ✅ Wallet nonces
- ✅ Analytics tracking

### 6. API Endpoints
- ✅ `POST /api/auth/nonce` - Get signature challenge
- ✅ `POST /api/auth/verify` - Verify wallet ownership
- ✅ `POST /api/share/generate` - Create share link (auth)
- ✅ `GET /api/share/resolve` - Get public profile
- ✅ `POST /api/share/verify` - Verify Merkle proof
- ✅ `POST /api/share/revoke` - Revoke link (auth)
- ✅ `GET /api/share/my-tokens` - List user's tokens (auth)

## 📁 File Structure

```
Flexanon/
├── src/
│   ├── config/
│   │   └── database.ts          ✅ PostgreSQL config
│   ├── lib/
│   │   ├── merkle.ts            ✅ Sparse Merkle Tree
│   │   ├── zerion.ts            ✅ Zerion API client
│   │   ├── crypto.ts            ✅ Hashing utilities
│   │   └── signature.ts         ✅ Signature verification
│   ├── routes/
│   │   ├── auth.ts              ✅ Auth endpoints
│   │   └── share.ts             ✅ Share endpoints
│   ├── services/
│   │   ├── portfolio.ts         ✅ Portfolio processing
│   │   └── share.ts             ✅ Token management
│   ├── types/
│   │   └── index.ts             ✅ TypeScript types
│   └── server.ts                ✅ Express app
├── scripts/
│   └── setup-db.ts              ✅ Database setup
├── tests/
│   └── test-merkle.ts           ✅ SMT tests
├── .env                         ✅ Environment config
├── .env.example                 ✅ Example config
├── .gitignore                   ✅ Git ignore
├── package.json                 ✅ Dependencies
├── tsconfig.json                ✅ TypeScript config
├── README.md                    ✅ Full documentation
└── QUICKSTART.md                ✅ Setup guide
```

## 🔐 Privacy Architecture

### How It Works:

```
1. USER CONNECTS WALLET
   ↓
2. FETCH PORTFOLIO FROM ZERION
   - Assets, balances, PnL, etc.
   ↓
3. BUILD MERKLE TREE
   - Convert each data point to a leaf
   - wallet_address → Leaf (hidden)
   - total_value → Leaf (revealed)
   - asset_SOL → Leaf (revealed)
   - asset_ETH → Leaf (hidden)
   ↓
4. COMMIT MERKLE ROOT
   - Single hash representing entire portfolio
   - Cannot be changed after commitment
   ↓
5. GENERATE SHARE LINK
   - Token contains: merkle_root + revealed_leaves + proofs
   - Wallet address encrypted server-side
   ↓
6. PUBLIC VIEW
   - Anyone sees: revealed data only
   - Verify button: checks proofs against root
   - Hidden data: never exposed
```

### Security Properties:

- ✅ **Privacy**: Wallet address never exposed publicly
- ✅ **Authenticity**: Data is cryptographically bound to root
- ✅ **Immutability**: Cannot fake data after commitment
- ✅ **Selective Disclosure**: Choose what to reveal
- ✅ **Verifiability**: Anyone can verify revealed data

## 🚀 Next Steps: Frontend

### What You Need to Build:

1. **Landing Page** (`/`)
   - Explain the concept
   - "Create Share Link" CTA
   - Connect wallet button

2. **Create Flow** (`/create`)
   - Wallet connection (EVM + Solana)
   - Sign nonce
   - Show portfolio preview
   - Privacy settings checkboxes:
     - [ ] Show total value
     - [ ] Show PnL
     - [ ] Show top 3 assets
     - [ ] Show wallet address
   - Generate button
   - Success: show share URL + copy button

3. **Public Profile** (`/s/[token]`)
   - Display revealed data:
     - Total value (if revealed)
     - PnL percentage (if revealed)
     - Top assets (if revealed)
   - "Verify" button → checks all proofs
   - Privacy badge showing hidden count
   - Social share buttons

4. **Dashboard** (`/dashboard`)
   - List user's share links
   - Revoke buttons
   - Analytics (view count)

### Frontend Tech Stack Recommendation:

```
- Next.js 14 (App Router)
- Tailwind CSS
- wagmi (EVM wallets)
- @solana/wallet-adapter (Solana)
- lucide-react (icons)
```

## 🧪 Testing Checklist

### Before Frontend:

1. ✅ Test Merkle tree implementation
   ```bash
   npm run test:merkle
   ```

2. ✅ Start backend
   ```bash
   npm run dev
   ```

3. ✅ Test endpoints with cURL (see QUICKSTART.md)

### With Frontend:

1. [ ] Connect wallet (EVM)
2. [ ] Connect wallet (Solana)
3. [ ] Sign message
4. [ ] Generate share link
5. [ ] Open public link (incognito)
6. [ ] Verify proofs
7. [ ] Revoke link
8. [ ] Check expiry works

## 📊 Database Schema

```sql
-- Share tokens
CREATE TABLE share_tokens (
  token_id VARCHAR(8) PRIMARY KEY,
  owner_hash VARCHAR(64) NOT NULL,        -- Privacy: hashed wallet
  merkle_root VARCHAR(64) NOT NULL,       -- SMT root
  revealed_leaves JSONB NOT NULL,         -- Public data
  proof_data JSONB NOT NULL,              -- Merkle proofs
  metadata JSONB,                         -- Chain, privacy score
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

-- Auth nonces
CREATE TABLE wallet_nonces (
  wallet_address VARCHAR(66) PRIMARY KEY,
  nonce VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Sessions
CREATE TABLE sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  wallet_address VARCHAR(66) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Analytics
CREATE TABLE share_views (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(8) NOT NULL,
  viewer_ip VARCHAR(45),
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);
```

## 🎬 Demo Script (for Video)

1. **Intro** (15s)
   - "Portfolio sharing without doxxing your wallet"

2. **Connect Wallet** (20s)
   - Show wallet connect
   - Sign nonce

3. **Generate Link** (30s)
   - Show portfolio
   - Select privacy settings
   - Generate share link

4. **Public View** (30s)
   - Open link (new window/incognito)
   - Show revealed data
   - Show "wallet: hidden"
   - Click Verify → all proofs valid

5. **Privacy Proof** (20s)
   - Try to see hidden data → can't
   - Explain SMT guarantees
   - Show revoke feature

6. **Outro** (5s)
   - "Built with Zerion API + SMT"

## 🔧 Environment Setup

### Required:

1. **Database**: Supabase (free) or local Postgres
2. **Zerion API Key**: Fill typeform
3. **Node.js**: v18+

### Optional:

- Vercel (deployment)
- Railway/Render (alternative)

## 📝 Submission Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed
- [ ] GitHub repo public
- [ ] README with setup instructions
- [ ] Demo video (< 5 min)
- [ ] Zerion API integration shown
- [ ] Privacy/SMT explained

## 🎯 Hackathon Judging Criteria

### Innovation (✅ Strong)
- Novel use of SMT for portfolio privacy
- Solana + EVM support
- Real cryptographic proofs

### User Experience (Frontend TODO)
- Simple wallet connect
- Clear privacy controls
- Beautiful profile cards

### Impact (✅ Strong)
- Solves real problem (doxxing)
- Social sharing without risk
- Verifiable claims

### Zerion API Usage (✅ Excellent)
- Full integration
- Multi-chain support
- Portfolio + PnL

### Technical Implementation (✅ Strong)
- Clean code
- Proper TypeScript
- Security best practices
- Custom SMT (not library)

## 💡 Future Enhancements (Post-Hackathon)

- [ ] IPFS storage for merkle roots (full decentralization)
- [ ] NFT-gated shares (token holders only)
- [ ] Time-based reveals (show more over time)
- [ ] Comparative privacy (compare without revealing)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Discord bot integration

---

## 🚀 YOU'RE READY!

The backend is **100% complete** and tested. Now build an amazing frontend and win that hackathon! 🏆

Need help? Check:
- `README.md` - Full API docs
- `QUICKSTART.md` - Setup guide
- `tests/test-merkle.ts` - SMT examples

Good luck! 🎉
