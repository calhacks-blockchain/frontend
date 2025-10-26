# Syncing Generated Solana Client Files

## Problem
The Next.js frontend cannot import files from outside its project directory (`peterpan-backend/dist/`). This causes build errors when trying to resolve the generated Solana client types.

## Solution
Copy the generated client files into the frontend project at `lib/solana/generated/`.

## One-Time Setup (Already Done)
1. ✅ Created `peterpan/lib/solana/generated/` directory
2. ✅ Copied files from `peterpan-backend/dist/js-client/`
3. ✅ Updated all imports in the frontend to use `@/lib/solana/generated/`
4. ✅ Added `@solana/kit` dependency to frontend

## Files Updated
- `app/api/tokens/route.ts`
- `app/api/status/[launchpadPubkey]/route.ts`
- `app/api/metrics/[launchpadPubkey]/route.ts`
- `app/api/launchpad/[launchpadPubkey]/route.ts`
- `app/api/current-price/[launchpadPubkey]/route.ts`

## When to Re-sync

Whenever the Solana program changes and Codama regenerates the client:

### Using the Sync Script (Recommended)
```bash
# From the project root
./sync-generated.sh
```

This script will:
1. Check if backend files exist
2. Copy all generated files to the frontend
3. Confirm successful sync

### Manual Sync
```bash
# From the project root
cp -r backend/dist/js-client/* frontend/lib/solana/generated/
```

### Verify
```bash
cd frontend
npm run build
```

## Note
The `peterpan-backend/dist/js-client/` files should be committed to git since they're auto-generated from the program IDL and needed by the frontend.

