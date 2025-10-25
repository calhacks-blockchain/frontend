import { z } from 'zod';

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  ticker: z.string().min(2, 'Ticker must be at least 2 characters').max(10, 'Ticker must be less than 10 characters').toUpperCase(),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(100, 'Tagline must be less than 100 characters'),
  logo: z.string().min(1, 'Logo is required'),
  coverImage: z.string().optional(),
  // Fundraising parameters (matching peterpan-front structure)
  totalSupply: z.string().min(1, 'Total supply is required'),
  valuation: z.string().min(1, 'Initial valuation is required'),
  percentageForSale: z.string().min(1, 'Percentage for sale is required'),
  targetRaise: z.string().min(1, 'Target raise is required'),
});

// Step 2: The Pitch
export const pitchSchema = z.object({
  elevatorPitch: z.string().min(50, 'Elevator pitch must be at least 50 characters').max(500, 'Elevator pitch must be less than 500 characters'),
  problem: z.string().min(50, 'Problem statement must be at least 50 characters').max(1000, 'Problem must be less than 1000 characters'),
  solution: z.string().min(50, 'Solution must be at least 50 characters').max(1000, 'Solution must be less than 1000 characters'),
  whyNow: z.string().min(50, 'Why now must be at least 50 characters').max(1000, 'Why now must be less than 1000 characters'),
});

// Step 3: Team
export const teamMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  role: z.string().min(2, 'Role is required'),
  photo: z.string().min(1, 'Photo is required'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
});

export const teamSchema = z.object({
  team: z.array(teamMemberSchema).min(1, 'At least one team member is required').max(10, 'Maximum 10 team members'),
});

// Step 4: Traction & Roadmap
export const tractionMetricSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  change: z.number().optional(),
});

export const roadmapItemSchema = z.object({
  quarter: z.string().min(1, 'Quarter is required'),
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['completed', 'in-progress', 'planned']),
});

export const tractionRoadmapSchema = z.object({
  traction: z.array(tractionMetricSchema).optional(),
  roadmap: z.array(roadmapItemSchema).min(3, 'At least 3 roadmap items are required'),
});

// Step 5: Tokenomics
export const tokenDistributionSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  percentage: z.number().min(0).max(100),
  color: z.string().min(1, 'Color is required'),
});

export const useOfFundsSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  percentage: z.number().min(0).max(100),
  amount: z.number().min(0),
});

export const tokenomicsSchema = z.object({
  goal: z.number().min(1000, 'Fundraising goal must be at least $1,000'),
  equityOffered: z.number().min(1, 'Equity offered must be at least 1%').max(50, 'Equity offered must be less than 50%'),
  founderAllocation: z.number().min(10, 'Founder allocation must be at least 10%').max(50, 'Founder allocation must be less than 50%'),
  tokenDistribution: z.array(tokenDistributionSchema).min(2, 'At least 2 distribution categories required'),
  useOfFunds: z.array(useOfFundsSchema).min(2, 'At least 2 use of funds categories required'),
}).refine((data) => {
  const total = data.tokenDistribution.reduce((sum, item) => sum + item.percentage, 0);
  return Math.abs(total - 100) < 0.01; // Allow for floating point errors
}, {
  message: 'Token distribution must total 100%',
  path: ['tokenDistribution'],
}).refine((data) => {
  const total = data.useOfFunds.reduce((sum, item) => sum + item.percentage, 0);
  return Math.abs(total - 100) < 0.01;
}, {
  message: 'Use of funds must total 100%',
  path: ['useOfFunds'],
});

// Step 6: Social & Media
export const socialMediaSchema = z.object({
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  discord: z.string().url('Invalid URL').optional().or(z.literal('')),
  telegram: z.string().url('Invalid URL').optional().or(z.literal('')),
  sliderImages: z.array(z.string()).length(3, 'Exactly 3 slider images are required'),
  tweetIds: z.array(z.string()).optional(),
});

// Combined schema for full form
export const createCoinFormSchema = z.object({
  basicInfo: basicInfoSchema,
  pitch: pitchSchema,
  team: teamSchema,
  tractionRoadmap: tractionRoadmapSchema,
  tokenomics: tokenomicsSchema,
  socialMedia: socialMediaSchema,
});

export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type PitchData = z.infer<typeof pitchSchema>;
export type TeamData = z.infer<typeof teamSchema>;
export type TractionRoadmapData = z.infer<typeof tractionRoadmapSchema>;
export type TokenomicsData = z.infer<typeof tokenomicsSchema>;
export type SocialMediaData = z.infer<typeof socialMediaSchema>;
export type CreateCoinFormData = z.infer<typeof createCoinFormSchema>;

