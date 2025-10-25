import { StartupData, PriceDataPoint } from '@/types/startup';

// Helper functions for generating mock data
function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWallet(): string {
  const chars = '0123456789abcdef';
  let wallet = '0x';
  for (let i = 0; i < 40; i++) {
    wallet += chars[Math.floor(Math.random() * chars.length)];
  }
  return wallet;
}

function generateRecentTrades() {
  const trades = [];
  for (let i = 0; i < 20; i++) {
    const type: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    const amount = randomFloat(0.1, 10, 2);
    const price = randomFloat(0.01, 1, 4);
    trades.push({
      id: Math.random().toString(36).substring(7),
      type,
      wallet: generateWallet(),
      amount,
      price,
      total: amount * price,
      timestamp: new Date(Date.now() - randomNumber(0, 3600000))
    });
  }
  return trades;
}

function generateTopHolders() {
  const holders = [];
  const totalSupply = 1000000;
  let remainingSupply = totalSupply;
  
  for (let i = 0; i < 10; i++) {
    const maxBalance = remainingSupply * 0.3;
    const balance = randomFloat(1000, maxBalance, 0);
    remainingSupply -= balance;
    
    holders.push({
      wallet: generateWallet(),
      balance,
      percentage: (balance / totalSupply) * 100,
      value: balance * randomFloat(0.01, 1, 4)
    });
  }
  
  return holders;
}

function generateTwitterPosts(companyName: string, logo: string) {
  const posts = [
    {
      id: '1',
      author: companyName,
      handle: companyName.toLowerCase().replace(/\s+/g, ''),
      avatar: logo,
      content: `Exciting news! We've just closed our Series A funding round. Thank you to all our early supporters who believed in our vision. This is just the beginning! 🚀`,
      timestamp: '2d ago',
      likes: randomNumber(50, 500),
      retweets: randomNumber(20, 150),
      replies: randomNumber(10, 80),
    },
    {
      id: '2',
      author: companyName,
      handle: companyName.toLowerCase().replace(/\s+/g, ''),
      avatar: logo,
      content: `Product update: Our latest release includes enhanced analytics, faster performance, and improved user experience. Check it out!`,
      timestamp: '4d ago',
      likes: randomNumber(30, 300),
      retweets: randomNumber(15, 100),
      replies: randomNumber(5, 50),
    },
    {
      id: '3',
      author: companyName,
      handle: companyName.toLowerCase().replace(/\s+/g, ''),
      avatar: logo,
      content: `We're hiring! Join our growing team and help us build the future. Open positions in engineering, design, and product. DM for details.`,
      timestamp: '1w ago',
      likes: randomNumber(40, 400),
      retweets: randomNumber(25, 200),
      replies: randomNumber(15, 100),
    },
    {
      id: '4',
      author: companyName,
      handle: companyName.toLowerCase().replace(/\s+/g, ''),
      avatar: logo,
      content: `Milestone alert! 🎉 We've reached 10,000 active users. Thank you to our amazing community for your continued support and feedback.`,
      timestamp: '2w ago',
      likes: randomNumber(100, 600),
      retweets: randomNumber(50, 250),
      replies: randomNumber(30, 120),
    },
  ];
  
  return posts;
}

// Sample tweet IDs for different companies (these can be customized per company)
const defaultTweetIds = [
  '1882530223897534599', // Example tech startup tweet
  '1882513360609001637',
  '1882495840690307178',
  '1882478320755838143',
];

// Detailed startup profiles
const startupProfiles: Omit<StartupData, 'recentTrades' | 'topHolders' | 'comments' | 'twitterPosts' | 'tweetIds'>[] = [
  {
    id: 'ashby',
    name: 'Ashby',
    ticker: 'ASHBY',
    logo: '/company-logos/ashbyhq.png',
    tagline: 'Modern recruiting platform for high-growth teams',
    price: 0.073,
    priceChange24h: 8.3,
    marketCap: 41500,
    volume24h: 3205,
    holders: 187,
    totalSupply: 1000000,
    raised: 41500,
    goal: 100000,
    equityOffered: 7,
    founderAllocation: 20,
    created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    daysActive: 15,
    founder: {
      name: 'Sarah Chen',
      wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f89a12',
      photo: '/company-logos/ashbyhq.png'
    },
    contractAddress: 'CSnmfyFZn14Hrz14F1Tm7bg44xeFFxkSBPgrbwEWpump',
    blockchain: 'solana',
    elevatorPitch: 'Ashby is building the first truly unified recruiting platform that combines ATS, CRM, and analytics into one seamless experience. We\'re making high-growth hiring 10x more efficient.',
    problem: 'Companies waste thousands of hours juggling multiple recruiting tools, losing candidates in the process. Current ATS systems are clunky, data is siloed, and hiring teams can\'t make data-driven decisions.',
    solution: 'We\'ve built a modern, API-first recruiting platform that consolidates all hiring workflows. Real-time analytics, automated scheduling, and intelligent candidate matching help teams hire faster and better.',
    whyNow: 'Remote work has exploded hiring competition. Companies need better tools to compete for talent. Plus, the recruiting software market is ripe for disruption - incumbents are slow and outdated.',
    team: [
      {
        name: 'Sarah Chen',
        role: 'CEO & Co-Founder',
        photo: '/company-logos/ashbyhq.png',
        linkedin: 'https://linkedin.com/in/sarah-chen',
        bio: 'Former Head of Engineering at Stripe'
      },
      {
        name: 'Michael Torres',
        role: 'CTO & Co-Founder',
        photo: '/company-logos/ashbyhq.png',
        linkedin: 'https://linkedin.com/in/michael-torres',
        bio: 'Ex-Google, built recruiting tools for 10k+ employees'
      }
    ],
    traction: [
      { label: 'Active Customers', value: '47', change: 15 },
      { label: 'Monthly Placements', value: '234', change: 28 },
      { label: 'MRR', value: '$12K', change: 42 }
    ],
    roadmap: [
      {
        quarter: 'Q1 2024',
        title: 'Platform Launch',
        description: 'Launch MVP with core ATS features',
        status: 'completed'
      },
      {
        quarter: 'Q2 2024',
        title: 'Analytics Dashboard',
        description: 'Advanced hiring metrics and reporting',
        status: 'in-progress'
      },
      {
        quarter: 'Q3 2024',
        title: 'AI Matching',
        description: 'ML-powered candidate recommendations',
        status: 'planned'
      },
      {
        quarter: 'Q4 2024',
        title: 'Enterprise Features',
        description: 'SSO, advanced permissions, compliance',
        status: 'planned'
      }
    ],
    tokenDistribution: [
      { category: 'Public Sale', percentage: 40, color: '#10b981' },
      { category: 'Founders', percentage: 20, color: '#3b82f6' },
      { category: 'Team', percentage: 15, color: '#8b5cf6' },
      { category: 'Advisors', percentage: 5, color: '#f59e0b' },
      { category: 'Future Rounds', percentage: 20, color: '#6b7280' }
    ],
    useOfFunds: [
      { category: 'Engineering', percentage: 40, amount: 40000 },
      { category: 'Sales & Marketing', percentage: 30, amount: 30000 },
      { category: 'Operations', percentage: 20, amount: 20000 },
      { category: 'Legal & Compliance', percentage: 10, amount: 10000 }
    ],
    website: 'https://ashbyhq.com',
    twitter: 'https://twitter.com/ashbyhq',
    hasGraduated: false
  },
  {
    id: 'glean',
    name: 'Glean',
    ticker: 'GLAN',
    logo: '/company-logos/glean.jpeg',
    tagline: 'Enterprise search powered by AI',
    price: 0.824,
    priceChange24h: -6.5,
    marketCap: 75300,
    volume24h: 8475,
    holders: 234,
    totalSupply: 1000000,
    raised: 75300,
    goal: 100000,
    equityOffered: 6,
    founderAllocation: 18,
    created: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    daysActive: 23,
    founder: {
      name: 'Arvind Jain',
      wallet: '0x9f5C5C6A4E2D3B1F8E7A6D5C4B3A2E1F0E9D8C7B',
      photo: '/company-logos/glean.jpeg'
    },
    contractAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    blockchain: 'solana',
    elevatorPitch: 'Glean makes company knowledge instantly searchable. One search bar to find anything across all your company\'s apps, powered by AI that understands context.',
    problem: 'Knowledge workers waste 2+ hours daily searching for information across dozens of siloed tools. Critical information is buried in Slack, Notion, Google Drive, and more.',
    solution: 'Our AI-powered search engine connects to all your company tools, understands context and permissions, and surfaces exactly what you need in milliseconds.',
    whyNow: 'Remote work has made knowledge sharing harder. AI breakthroughs enable semantic search that actually works. Companies are desperate for productivity solutions.',
    team: [
      {
        name: 'Arvind Jain',
        role: 'CEO & Founder',
        photo: '/company-logos/glean.jpeg',
        linkedin: 'https://linkedin.com/in/arvind-jain',
        bio: 'Former Google Search Engineering Lead'
      },
      {
        name: 'Tony Gentilcore',
        role: 'CTO',
        photo: '/company-logos/glean.jpeg',
        linkedin: 'https://linkedin.com/in/tony-gentilcore',
        bio: 'Ex-Facebook, built indexing systems'
      }
    ],
    traction: [
      { label: 'Enterprise Customers', value: '23', change: 21 },
      { label: 'Queries/Day', value: '45K', change: 67 },
      { label: 'ARR', value: '$280K', change: 112 }
    ],
    roadmap: [
      {
        quarter: 'Q1 2024',
        title: 'Core Search Engine',
        description: 'Launch semantic search across 20+ integrations',
        status: 'completed'
      },
      {
        quarter: 'Q2 2024',
        title: 'AI Assistant',
        description: 'Conversational interface for knowledge queries',
        status: 'in-progress'
      },
      {
        quarter: 'Q3 2024',
        title: 'Proactive Insights',
        description: 'AI surfaces relevant information automatically',
        status: 'planned'
      },
      {
        quarter: 'Q4 2024',
        title: 'Enterprise Scale',
        description: '100+ integrations, advanced security',
        status: 'planned'
      }
    ],
    tokenDistribution: [
      { category: 'Public Sale', percentage: 35, color: '#10b981' },
      { category: 'Founders', percentage: 18, color: '#3b82f6' },
      { category: 'Team', percentage: 17, color: '#8b5cf6' },
      { category: 'Investors', percentage: 10, color: '#f59e0b' },
      { category: 'Treasury', percentage: 20, color: '#6b7280' }
    ],
    useOfFunds: [
      { category: 'AI/ML Research', percentage: 45, amount: 45000 },
      { category: 'Engineering', percentage: 30, amount: 30000 },
      { category: 'Sales', percentage: 15, amount: 15000 },
      { category: 'Operations', percentage: 10, amount: 10000 }
    ],
    website: 'https://glean.com',
    twitter: 'https://twitter.com/gleanwork',
    hasGraduated: false
  },
  {
    id: 'posthog',
    name: 'PostHog',
    ticker: 'PHOG',
    logo: '/company-logos/posthog.jpeg',
    tagline: 'Open-source product analytics platform',
    price: 4.53,
    priceChange24h: 12.1,
    marketCap: 56300,
    volume24h: 32900,
    holders: 287,
    totalSupply: 1000000,
    raised: 15000,
    goal: 150000,
    equityOffered: 10,
    founderAllocation: 25,
    created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    daysActive: 8,
    founder: {
      name: 'James Hawkins',
      wallet: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
      photo: '/company-logos/posthog.jpeg'
    },
    contractAddress: 'So11111111111111111111111111111111111111112',
    blockchain: 'solana',
    elevatorPitch: 'PostHog is the all-in-one product OS - analytics, feature flags, session recording, and experiments. Self-hosted or cloud, completely open-source.',
    problem: 'Product teams juggle 5+ tools (Mixpanel, LaunchDarkly, Hotjar, Optimizely) paying $50k+/year. Data privacy concerns with third-party analytics.',
    solution: 'We built a single platform that does everything - analytics, feature flags, session replay, A/B testing. Open-source, self-hostable, 10x cheaper.',
    whyNow: 'Data privacy regulations forcing self-hosting. Engineers tired of vendor lock-in. Open-source eating the world. Product teams need integrated workflows.',
    team: [
      {
        name: 'James Hawkins',
        role: 'CEO & Co-Founder',
        photo: '/company-logos/posthog.jpeg',
        linkedin: 'https://linkedin.com/in/james-hawkins',
        bio: 'YC alum, previously built & sold startup'
      },
      {
        name: 'Tim Glaser',
        role: 'CTO & Co-Founder',
        photo: '/company-logos/posthog.jpeg',
        linkedin: 'https://linkedin.com/in/tim-glaser',
        bio: 'Ex-Uber, open-source contributor'
      }
    ],
    traction: [
      { label: 'GitHub Stars', value: '12.3K', change: 45 },
      { label: 'Active Instances', value: '3,400', change: 89 },
      { label: 'MRR', value: '$67K', change: 156 }
    ],
    roadmap: [
      {
        quarter: 'Q1 2024',
        title: 'Analytics + Feature Flags',
        description: 'Core product analytics and feature management',
        status: 'completed'
      },
      {
        quarter: 'Q2 2024',
        title: 'Session Recording',
        description: 'Watch user sessions with privacy controls',
        status: 'in-progress'
      },
      {
        quarter: 'Q3 2024',
        title: 'Experimentation',
        description: 'Native A/B testing and multivariate experiments',
        status: 'planned'
      },
      {
        quarter: 'Q4 2024',
        title: 'Data Warehouse',
        description: 'Store and query unlimited product data',
        status: 'planned'
      }
    ],
    tokenDistribution: [
      { category: 'Public Sale', percentage: 45, color: '#10b981' },
      { category: 'Founders', percentage: 25, color: '#3b82f6' },
      { category: 'Team', percentage: 12, color: '#8b5cf6' },
      { category: 'Community', percentage: 8, color: '#f59e0b' },
      { category: 'Treasury', percentage: 10, color: '#6b7280' }
    ],
    useOfFunds: [
      { category: 'Engineering', percentage: 50, amount: 75000 },
      { category: 'Developer Relations', percentage: 20, amount: 30000 },
      { category: 'Infrastructure', percentage: 20, amount: 30000 },
      { category: 'Operations', percentage: 10, amount: 15000 }
    ],
    website: 'https://posthog.com',
    twitter: 'https://twitter.com/posthog',
    hasGraduated: false
  }
];

// Generate price history data for charts
export function generatePriceHistory(currentPrice: number, days: number = 30): PriceDataPoint[] {
  const data: PriceDataPoint[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  let price = currentPrice * randomFloat(0.5, 0.8);
  
  for (let i = days; i >= 0; i--) {
    const change = randomFloat(-0.1, 0.15);
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * randomFloat(1, 1.05);
    const low = Math.min(open, close) * randomFloat(0.95, 1);
    
    data.push({
      time: Math.floor((now - i * dayMs) / 1000),
      open,
      high,
      low,
      close,
      volume: randomFloat(1000, 50000, 0)
    });
    
    price = close;
  }
  
  // Adjust the last price to match current price
  if (data.length > 0) {
    const last = data[data.length - 1];
    const ratio = currentPrice / last.close;
    last.close = currentPrice;
    last.high = Math.max(last.high * ratio, currentPrice);
    last.low = Math.min(last.low * ratio, currentPrice);
  }
  
  return data;
}

// Get startup by ID
export function getStartupById(id: string): StartupData | null {
  const profile = startupProfiles.find(s => s.id === id);
  if (!profile) return null;
  
  return {
    ...profile,
    recentTrades: generateRecentTrades(),
    topHolders: generateTopHolders(),
    comments: [],
    twitterPosts: generateTwitterPosts(profile.name, profile.logo),
    tweetIds: defaultTweetIds
  };
}

// Get all startup IDs
export function getAllStartupIds(): string[] {
  return startupProfiles.map(s => s.id);
}

// Get random startup (for development)
export function getRandomStartup(): StartupData {
  const profile = startupProfiles[Math.floor(Math.random() * startupProfiles.length)];
  return {
    ...profile,
    recentTrades: generateRecentTrades(),
    topHolders: generateTopHolders(),
    comments: [],
    twitterPosts: generateTwitterPosts(profile.name, profile.logo),
    tweetIds: defaultTweetIds
  };
}

