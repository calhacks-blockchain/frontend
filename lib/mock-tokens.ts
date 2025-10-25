import { TokenData } from '@/components/token-card';

// Real startup companies with their logos
const companies = [
  { name: 'Arc', ticker: 'ARC', logo: '/company-logos/arc.png' },
  { name: 'Ashby', ticker: 'ASHBY', logo: '/company-logos/ashbyhq.png' },
  { name: 'Axiom', ticker: 'AXIOM', logo: '/company-logos/axiom.jpeg' },
  { name: 'Buffer', ticker: 'BUFF', logo: '/company-logos/buffer.jpeg' },
  { name: 'ChiliPiper', ticker: 'CHILI', logo: '/company-logos/chilipiper.png' },
  { name: 'Close', ticker: 'CLOSE', logo: '/company-logos/close.jpeg' },
  { name: 'Cluely', ticker: 'CLUE', logo: '/company-logos/cluely.jpeg' },
  { name: 'Cohere', ticker: 'COHR', logo: '/company-logos/cohere.png' },
  { name: 'Coiled', ticker: 'COIL', logo: '/company-logos/coiled.jpeg' },
  { name: 'Daloopa', ticker: 'DALO', logo: '/company-logos/daloopa.jpeg' },
  { name: 'Eco', ticker: 'ECO', logo: '/company-logos/eco.jpeg' },
  { name: 'Glean', ticker: 'GLAN', logo: '/company-logos/glean.jpeg' },
  { name: 'Kanmon', ticker: 'KANM', logo: '/company-logos/kanmon.jpeg' },
  { name: 'Koyfin', ticker: 'KYFN', logo: '/company-logos/koyfin.png' },
  { name: 'Papercup', ticker: 'PAPR', logo: '/company-logos/papercup.jpeg' },
  { name: 'PostHog', ticker: 'PHOG', logo: '/company-logos/posthog.jpeg' },
  { name: 'RunPod', ticker: 'RPOD', logo: '/company-logos/runpod.jpeg' },
  { name: 'Vercel', ticker: 'VRCL', logo: '/company-logos/vercel.png' },
];

const timeUnits = [
  '3m', '4m', '5h', '7m', '17s', '23m', '30s', '1h', '2h', '45m', '15m', '6h', '12h', '24s'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomPrice(): string {
  const rand = Math.random();
  if (rand < 0.3) return randomFloat(0.001, 0.1, 3).toString();
  if (rand < 0.6) return randomFloat(0.1, 10, 2).toString();
  return randomFloat(10, 1000, 0).toString();
}

function randomMarketCap(): string {
  const rand = Math.random();
  if (rand < 0.3) return `${randomFloat(1, 100, 1)}K`;
  if (rand < 0.7) return `${randomFloat(100, 999, 0)}K`;
  return `${randomFloat(1, 50, 1)}M`;
}

function randomPercentage(): number {
  const isPositive = Math.random() > 0.5;
  const value = randomFloat(0, 100, 0);
  return isPositive ? value : -value;
}

export function generateMockToken(): TokenData {
  const company = getRandomElement(companies);
  // For testing: All tokens navigate to 'ashby' page
  // Add random suffix to ensure unique React keys
  const id = `ashby-${Math.random().toString(36).substring(7)}`;

  return {
    id,
    name: company.name,
    ticker: company.ticker,
    image: company.logo,
    marketCap: randomMarketCap(),
    price: randomPrice(),
    volume: randomPrice(),
    timeAgo: getRandomElement(timeUnits),
    holders: randomNumber(50, 5000),
    txCount: randomNumber(5, 2500),
    liquidity: randomFloat(0.1, 100, 1).toString(),
    fdv: randomFloat(0.01, 10, 2).toString(),
    buyPressure: randomNumber(0, 100),
    sellPressure: randomNumber(0, 100),
    priceChange5m: randomPercentage(),
    priceChange1h: randomPercentage(),
    priceChange6h: randomPercentage(),
    priceChange24h: randomPercentage(),
  };
}

export function generateMockTokens(count: number): TokenData[] {
  return Array.from({ length: count }, () => generateMockToken());
}

