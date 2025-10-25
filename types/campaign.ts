export interface TokenCampaign {
  id: number;
  launchpad_pubkey: string;
  mint_pubkey: string;
  token_vault_pubkey: string;
  authority_pubkey: string;
  token_uri: string;
  
  // Basic Info
  name: string;
  symbol: string;
  tagline: string;
  logo_url: string;
  cover_image_url?: string;
  
  // The Pitch
  elevator_pitch: string;
  problem: string;
  solution: string;
  why_now: string;
  
  // Team
  team_members: TeamMember[];
  
  // Traction & Roadmap
  traction_metrics: TractionMetric[];
  roadmap_items: RoadmapItem[];
  
  // Tokenomics
  fundraising_goal: number;
  equity_offered: number;
  founder_allocation: number;
  token_distribution: TokenDistribution[];
  use_of_funds: UseOfFunds[];
  
  // Social & Media
  website_url?: string;
  twitter_url?: string;
  discord_url?: string;
  telegram_url?: string;
  slider_images: string[];
  tweet_ids: string[];
  
  // Deployment Info
  total_supply: string;
  tokens_for_sale: string;
  initial_price_lamports_per_token: string;
  
  // Fundraising Parameters
  initial_valuation_sol: number;
  percentage_for_sale: number;
  target_raise_sol: number;
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  deployment_signature?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  linkedin?: string;
  bio?: string;
}

export interface TractionMetric {
  label: string;
  value: string;
  change?: number;
}

export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
}

export interface TokenDistribution {
  category: string;
  percentage: number;
  color: string;
}

export interface UseOfFunds {
  category: string;
  percentage: number;
  amount: number;
}

export interface SaveCampaignRequest {
  formData: {
    basicInfo: {
      name: string;
      ticker: string;
      tagline: string;
      logo: string;
      coverImage?: string;
      totalSupply: string;
      valuation: string;
      percentageForSale: string;
      targetRaise: string;
    };
    pitch: {
      elevatorPitch: string;
      problem: string;
      solution: string;
      whyNow: string;
    };
    team: {
      team: TeamMember[];
    };
    tractionRoadmap: {
      traction?: TractionMetric[];
      roadmap: RoadmapItem[];
    };
    tokenomics: {
      goal: number;
      equityOffered: number;
      founderAllocation: number;
      tokenDistribution: TokenDistribution[];
      useOfFunds: UseOfFunds[];
    };
    socialMedia: {
      website?: string;
      twitter?: string;
      discord?: string;
      telegram?: string;
      sliderImages: string[];
      tweetIds?: string[];
    };
  };
  launchpadPubkey: string;
  mintPubkey: string;
  tokenVaultPubkey: string;
  authorityPubkey: string;
  tokenUri: string;
  deploymentSignature?: string;
  totalSupply: string;
  tokensForSale: string;
  initialPriceLamportsPerToken: string;
}
