# 🚀 Quick Start Guide

## Step 1: Install Dependencies

```bash
cd flexanon
npm install
```

## Step 2: Set Up Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit with your actual credentials
nano .env
```

### Required Environment Variables:

1. **DATABASE_URL** - PostgreSQL connection string
   - **Option A (Supabase - Recommended):**
     - Go to https://supabase.com
     - Create new project
     - Go to Settings > Database
     - Copy "Connection String" (use "Session" mode)
     - Example: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`
   
   - **Option B (Local PostgreSQL):**
     ```bash
     createdb flexanon
     # Use: postgresql://localhost:5432/flexanon
     ```

2. **ZERION_API_KEY** - Get from Zerion
   - Fill out form: https://zerion-io.typeform.com/to/QI3GRa7t?utm_source=cypherpunk
   - Wait for email with API key
   - Paste into .env

3. **JWT_SECRET** - Random string for session tokens
   ```bash
   # Generate random secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **ENCRYPTION_KEY** - 32-byte key for encryption
   ```bash
   # Generate encryption key:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Step 3: Initialize Database

```bash
npm run db:setup
```

You should see:
```
✅ Database schema initialized successfully
```

## Step 4: Test Merkle Tree (Optional)

```bash
npm run test:merkle
```

You should see:
```
🎉 All tests PASSED!
```

## Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 Flexanon Backend Server
================================
✅ Server running on port 3001
✅ Environment: development
✅ Health check: http://localhost:3001/health
```

## Step 6: Test the API

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Test Authentication Flow

1. **Get a nonce:**
```bash
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"YOUR_WALLET_ADDRESS"}'
```

2. **Sign the message** with your wallet (MetaMask/Phantom)

3. **Verify signature:**
```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "signature": "YOUR_SIGNATURE",
    "chain": "solana"
  }'
```

## Troubleshooting

### Database Connection Issues

**Error: `connection refused`**
- Check DATABASE_URL is correct
- For Supabase: make sure you're using the "Session" connection string
- For local: ensure PostgreSQL is running: `brew services start postgresql`

**Error: `SSL required`**
- For Supabase: add `?sslmode=require` to end of DATABASE_URL
- Example: `postgresql://...postgres?sslmode=require`

### Zerion API Issues

**Error: `Failed to fetch portfolio: 401`**
- Check ZERION_API_KEY is correct
- Ensure no extra spaces in .env file
- Wait a few minutes after receiving key (activation delay)

**Error: `No portfolio data found`**
- Wallet might not have any assets
- Try a different wallet address
- Check chain is correct (solana/ethereum/polygon/base)

### Port Already in Use

**Error: `EADDRINUSE: address already in use :::3001`**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
PORT=3002
```

## Next Steps

Once the backend is running:

1. **Build the frontend** (Next.js app)
2. **Test wallet connection** and signature flow
3. **Generate your first share link**
4. **Test the public profile page**

## Development Tips

### Watch mode with logs
```bash
npm run dev
```
This will auto-restart on file changes.

### Check database tables
```bash
# Connect to Supabase
# Go to Table Editor in Supabase dashboard

# Or connect locally
psql flexanon
\dt  # list tables
SELECT * FROM share_tokens;
```

### Clear test data
```sql
DELETE FROM share_tokens;
DELETE FROM sessions;
DELETE FROM wallet_nonces;
```

## Production Deployment

When ready to deploy:

1. Set `NODE_ENV=production`
2. Use production database
3. Set proper `BASE_URL` and `ALLOWED_ORIGINS`
4. Deploy to Vercel/Railway/Render
5. Enable HTTPS

---

Need help? Check the main README.md for full API documentation.
