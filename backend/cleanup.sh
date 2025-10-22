#!/bin/bash

echo "Cleaning up FlexAnon backend for production..."
echo ""

cd "$(dirname "$0")"

echo "[1/3] Removing unnecessary documentation files..."
rm -f IMPLEMENTATION_SUMMARY.md
rm -f RELAYER.md
rm -f SECURITY_FINAL.md
rm -f ../QUICKSTART_RELAYER.md
rm -f ../RELAYER_DESIGN.md
rm -f ../SOLANA_PROGRAM_CHANGES.md

echo "[2/3] Removing shell script files..."
rm -f ../deploy-local.sh
rm -f ../rebuild-idl.sh
rm -f ../run-e2e-tests.sh
rm -f ../run-tests.sh

echo "[3/3] Keeping only essential files..."
echo "  - README.md (cleaned)"
echo "  - .env.example"
echo "  - src/ (production code)"
echo "  - tests/ (test suite)"

echo ""
echo "Cleanup complete!"
echo ""
echo "Production-ready files:"
ls -la | grep -E "^(d|-).*\.(ts|js|json|env|md)$|^src$|^tests$|^scripts$"

echo ""
echo "Next steps:"
echo "1. Review .env configuration"
echo "2. Deploy Solana program to devnet"
echo "3. Update SOLANA_PROGRAM_ID in .env"
echo "4. Run: pnpm install && pnpm run dev"
