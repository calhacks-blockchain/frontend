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

### Step 1: Regenerate in Backend
```bash
cd peterpan-backend
# Run your Codama generation script
# This updates peterpan-backend/dist/js-client/
```

### Step 2: Copy to Frontend
```bash
cd /Users/omarlahloumimi/peterpain-main
cp -r peterpan-backend/dist/js-client/* peterpan/lib/solana/generated/
```

### Step 3: Verify
```bash
cd peterpan
npm run build
```

## Alternative: Automated Sync

You can add this to your package.json scripts:

```json
{
  "scripts": {
    "sync-client": "cp -r ../peterpan-backend/dist/js-client/* lib/solana/generated/"
  }
}
```

Then run: `npm run sync-client`

## Note
The `peterpan-backend/dist/js-client/` files should be committed to git since they're auto-generated from the program IDL and needed by the frontend.

