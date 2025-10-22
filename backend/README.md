# FlexAnon Backend

Privacy-preserving portfolio sharing with merkle proofs on Solana.

## Features

- Zerion API integration for portfolio data
- Privacy-preserving relayer service
- Merkle tree commitments on Solana
- Wallet signature authentication
- Selective data disclosure

## Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
pnpm run db:setup

# Start development server
pnpm run dev
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flexanon

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your_program_id
SOLANA_NETWORK=devnet

# Zerion API
ZERION_API_KEY=your_api_key

# Relayer (optional - for privacy-preserving commits)
RELAYER_PRIVATE_KEY=your_base58_private_key
# OR
RELAYER_KEYPAIR_PATH=/path/to/keypair.json
```

## API Endpoints

### Share Management
- `POST /api/share/generate` - Generate share link (auth required)
- `GET /api/share/resolve?token=xxx` - Resolve share link
- `POST /api/share/verify` - Verify merkle proof
- `POST /api/share/revoke` - Revoke share link (auth required)
- `GET /api/share/my-tokens` - List user's tokens (auth required)

### Relayer (Privacy-Preserving)
- `POST /api/relayer/commit` - Submit commitment via relayer (auth required)
- `GET /api/relayer/status` - Check relayer status
- `GET /api/relayer/balance` - Check relayer balance

## Testing

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm run test:merkle
pnpm run test:integration
pnpm run test:e2e
```

## Architecture

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL
- **Blockchain**: Solana (Anchor framework)
- **Privacy**: Sparse Merkle Trees + Relayer service

## Security

- Wallet signature verification for all protected endpoints
- Rate limiting on relayer (1 commit/minute per wallet)
- No wallet addresses exposed in share links
- Merkle proofs for data verification

## License

MIT
