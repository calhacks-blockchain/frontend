// Extended startup/coin data types for the coin detail page

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  linkedin?: string;
  bio?: string;
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

export interface TractionMetric {
  label: string;
  value: string;
  change?: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  wallet: string;
  amount: number;
  price: number;
  total: number;
  timestamp: Date;
}

export interface Holder {
  wallet: string;
  balance: number;
  percentage: number;
  value: number;
}

export interface Comment {
  id: string;
  user: string;
  wallet: string;
  content: string;
  timestamp: Date;
  likes: number;
}

export interface TwitterPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  image?: string;
}

export interface StartupData {
  // Basic Info
  id: string;
  name: string;
  ticker: string;
  logo: string;
  coverImage?: string;
  tagline: string;
  
  // Trading Data
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  
  // Fundraising Data
  raised: number;
  goal: number;
  equityOffered: number;
  founderAllocation: number;
  
  // Timestamps
  created: Date;
  daysActive: number;
  
  // Founder Info
  founder: {
    name: string;
    wallet: string;
    photo?: string;
  };
  
  // Contract Info
  contractAddress: string;
  blockchain: 'solana' | 'ethereum';
  
  // Company Details
  elevatorPitch: string;
  problem: string;
  solution: string;
  whyNow: string;
  
  // Team
  team: TeamMember[];
  
  // Traction
  traction?: TractionMetric[];
  
  // Roadmap
  roadmap: RoadmapItem[];
  
  // Tokenomics
  tokenDistribution: TokenDistribution[];
  useOfFunds: UseOfFunds[];
  
  // Social Links
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  
  // Documents (post-graduation)
  hasGraduated: boolean;
  safeDocUrl?: string;
  
  // Activity Data
  recentTrades: Trade[];
  topHolders: Holder[];
  comments: Comment[];
  
  // Social Media
  twitterPosts?: TwitterPost[];
  tweetIds?: string[]; // Array of tweet IDs to display real tweets from X
}

// Price history data for charts
export interface PriceDataPoint {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}


