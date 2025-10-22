# Production Deployment Checklist

## Pre-Deployment

- [ ] Remove all development .md files
- [ ] Remove all .sh script files  
- [ ] Update .env with production values
- [ ] Remove dev routes (set NODE_ENV=production)
- [ ] Run all tests: `pnpm test`
- [ ] Build TypeScript: `pnpm run build`

## Solana Program

- [ ] Deploy program to devnet: `anchor deploy --provider.cluster devnet`
- [ ] Update SOLANA_PROGRAM_ID in .env
- [ ] Verify program on Solana Explorer

## Relayer Setup

- [ ] Generate relayer keypair: `solana-keygen new`
- [ ] Fund relayer wallet with SOL
- [ ] Set RELAYER_PRIVATE_KEY or RELAYER_KEYPAIR_PATH in .env
- [ ] Test relayer status: `curl http://localhost:3001/api/relayer/status`

## Database

- [ ] Create PostgreSQL database
- [ ] Update DATABASE_URL in .env
- [ ] Run migrations: `pnpm run db:setup`

## Environment Variables

- [ ] PORT
- [ ] NODE_ENV=production
- [ ] DATABASE_URL
- [ ] SOLANA_RPC_URL
- [ ] SOLANA_PROGRAM_ID
- [ ] SOLANA_NETWORK=devnet
- [ ] ZERION_API_KEY
- [ ] RELAYER_PRIVATE_KEY
- [ ] BASE_URL
- [ ] ALLOWED_ORIGINS

## Security

- [ ] Enable CORS for specific origins only
- [ ] Set secure DATABASE_URL with strong password
- [ ] Keep relayer private key secure
- [ ] Enable HTTPS in production
- [ ] Set rate limits

## Testing

- [ ] Health check: `curl http://localhost:3001/health`
- [ ] Test Zerion integration (dev route)
- [ ] Test relayer commit
- [ ] Test share link generation
- [ ] Verify privacy (user wallet not visible on-chain)

## Monitoring

- [ ] Set up logging
- [ ] Monitor relayer balance
- [ ] Monitor database connections
- [ ] Set up alerts for errors

## Cleanup

Run the cleanup script:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

This will remove:
- Unnecessary .md files
- Development .sh scripts
- Keep only README.md and essential code

## Start Production Server

```bash
pnpm install
pnpm run build
pnpm start
```

Or with PM2:
```bash
pm2 start dist/server.js --name flexanon-backend
```
