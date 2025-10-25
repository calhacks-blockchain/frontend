# Generated Solana Client

This directory contains auto-generated TypeScript client code from the Solana program IDL using [Codama](https://github.com/codama-idl/codama).

## Source

These files are copied from `peterpan-backend/dist/js-client/` and provide:
- Account decoders and encoders
- Instruction builders
- Type definitions
- Error handling

## Keeping in Sync

When the Solana program changes, you need to:

1. Regenerate the client in the backend:
   ```bash
   cd peterpan-backend
   # Run Codama generation (add this to your build process)
   ```

2. Copy the updated files to the frontend:
   ```bash
   cd peterpain-main
   cp -r peterpan-backend/dist/js-client/* peterpan/lib/solana/generated/
   ```

## Usage

Import types and functions using the `@/lib/solana/generated` path:

```typescript
import { 
  getLaunchpadStateDecoder, 
  LAUNCHPAD_STATE_DISCRIMINATOR,
  type LaunchpadState 
} from '@/lib/solana/generated/accounts/launchpadState';
```

## Files

- `accounts/` - Account decoders and types
- `instructions/` - Instruction builders
- `programs/` - Program addresses and identifiers
- `types/` - Shared type definitions
- `errors/` - Program error codes and handlers
- `shared/` - Utility functions

