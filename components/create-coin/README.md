# Create a Coin Feature

## Overview
A comprehensive 7-step wizard for creating and deploying startup tokens on the Solana blockchain.

## Architecture

### File Structure
```
components/create-coin/
├── create-wizard.tsx           # Main wizard orchestrator
├── step-indicator.tsx          # Progress indicator component
├── form-fields/
│   └── image-upload.tsx       # Reusable image upload component
└── steps/
    ├── basic-info-step.tsx    # Step 1: Company name, ticker, logo
    ├── pitch-step.tsx         # Step 2: Elevator pitch, problem, solution
    ├── team-step.tsx          # Step 3: Team members (dynamic)
    ├── traction-roadmap-step.tsx  # Step 4: Metrics & milestones
    ├── tokenomics-step.tsx    # Step 5: Token distribution & use of funds
    ├── social-media-step.tsx  # Step 6: Social links & showcase images
    └── review-deploy-step.tsx # Step 7: Review & deploy

lib/create-coin/
├── form-store.ts              # Zustand store for state management
└── validation.ts              # Zod schemas for validation

app/create/
└── page.tsx                   # Main create page with auth check
```

## Features

### ✅ Completed
- **7-Step Wizard**: Intuitive multi-step form with progress indicator
- **Form Validation**: Comprehensive Zod schemas for all fields
- **State Management**: Zustand store with localStorage persistence (auto-save)
- **Image Uploads**: Drag-and-drop image upload with preview
- **Dynamic Arrays**: Add/remove team members, roadmap items, metrics, etc.
- **Smart Defaults**: Pre-populated tokenomics templates
- **Auto-calculations**: Use of funds amounts calculated from percentages
- **Validation Feedback**: Real-time validation with error messages
- **Progress Tracking**: Visual progress indicator (desktop) and progress bar (mobile)
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Authentication**: Requires user login to access
- **Review Step**: Comprehensive preview before deployment

## How It Works

### Step 1: Basic Info
- Company name, ticker symbol (2-10 chars, auto-uppercase)
- Tagline (10-100 chars)
- Logo upload (square, recommended 512x512px)
- Optional cover image (wide banner)

### Step 2: The Pitch
- Elevator pitch (50-500 chars)
- Problem statement (50-1000 chars)
- Solution (50-1000 chars)
- Why now? (50-1000 chars)

### Step 3: Team
- Add 1-10 team members
- Name, role, photo, LinkedIn (optional), bio (optional)
- First member is labeled as "Founder"

### Step 4: Traction & Roadmap
- Optional traction metrics with growth %
- Roadmap (minimum 3 milestones required)
- Quarter, title, description, status (completed/in-progress/planned)

### Step 5: Tokenomics
- Fundraising goal (min $1,000)
- Equity offered (1-50%)
- Founder allocation (10-50%)
- Token distribution (must total 100%)
- Use of funds (must total 100%, auto-calculates amounts)

### Step 6: Social & Media
- Website, Twitter, Discord, Telegram (all optional)
- 3 showcase images (required, wide aspect ratio)
- Optional tweet IDs for featured tweets

### Step 7: Review & Deploy
- Comprehensive preview of all data
- Deployment information (network, fee, time)
- Deploy button (connects wallet and creates contract)

## State Management

### Zustand Store
The form state is managed by Zustand and automatically persisted to localStorage:

```typescript
const { basicInfo, setBasicInfo } = useCreateCoinStore();
```

Features:
- Auto-save on every change
- Persist draft across page reloads
- Reset form after successful deployment
- Access all data with `getAllData()`

### Validation
Each step validates on submit using Zod schemas:

```typescript
const result = basicInfoSchema.safeParse(basicInfo);
```

## UI/UX Features

### Desktop
- Horizontal step indicator with clickable steps (can go back)
- Side-by-side layout for complex forms
- Hover states and transitions

### Mobile
- Compact progress bar showing % complete
- Vertical stacked layout
- Touch-friendly controls

### Accessibility
- Proper label associations
- Required field indicators (*)
- Error messages linked to inputs
- Keyboard navigation support

## Next Steps (TODO)

### Smart Contract Deployment
Currently the deploy button simulates deployment. To implement:

1. **Connect Phantom Wallet**
   ```typescript
   import { useWallet } from '@solana/wallet-adapter-react';
   const { connected, publicKey, signTransaction } = useWallet();
   ```

2. **Create SPL Token**
   - Use `@solana/spl-token` to create token
   - Set up token metadata program

3. **Upload Metadata**
   - Upload images to Supabase Storage or IPFS
   - Store JSON metadata on Arweave

4. **Store in Database**
   - Save all form data to Supabase
   - Link to contract address
   - Create initial price/trading data

5. **Handle Fees**
   - Charge deployment fee (e.g., 0.1 SOL)
   - Send transaction from user wallet

### Enhancements
- [ ] Add preview pane (live side-by-side preview)
- [ ] Template library (pre-built templates)
- [ ] Draft management dashboard
- [ ] Collaboration (share drafts with co-founders)
- [ ] Edit functionality for deployed coins (founder only)
- [ ] Image optimization (compress, convert to WebP)
- [ ] Bulk upload for team photos
- [ ] Import from CSV/JSON
- [ ] AI-assisted pitch writing

## Usage

### Accessing the Feature
1. User must be logged in
2. Click "Create Coin" button in navbar
3. Or navigate to `/create`

### Creating a Coin
1. Fill out all 7 steps
2. Review data in final step
3. Click "Deploy Coin"
4. Sign transaction in Phantom wallet
5. Wait for deployment (~30 seconds)
6. Redirected to new coin page

### Editing a Draft
- Form auto-saves to localStorage
- Close browser and return anytime
- Progress is preserved
- Can navigate between steps freely

## Theme Integration

The feature uses your project's design system:
- `bg-card` with `border-border` for cards
- `text-primary` for accent colors
- `text-muted-foreground` for secondary text
- Rounded corners (`rounded-lg`)
- Consistent button styles from `components/ui/button.tsx`
- Matches existing navbar and page layouts

## Dependencies

### New Packages Installed
- `zod` - Schema validation
- `zustand` - State management

### Existing Dependencies Used
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icons
- `next` - Routing and navigation
- `react` - Component library
- `tailwindcss` - Styling

