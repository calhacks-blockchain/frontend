import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BasicInfoData,
  PitchData,
  TeamData,
  TractionRoadmapData,
  TokenomicsData,
  SocialMediaData,
} from './validation';

interface CreateCoinStore {
  currentStep: number;
  basicInfo: Partial<BasicInfoData>;
  pitch: Partial<PitchData>;
  team: Partial<TeamData>;
  tractionRoadmap: Partial<TractionRoadmapData>;
  tokenomics: Partial<TokenomicsData>;
  socialMedia: Partial<SocialMediaData>;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setBasicInfo: (data: Partial<BasicInfoData>) => void;
  setPitch: (data: Partial<PitchData>) => void;
  setTeam: (data: Partial<TeamData>) => void;
  setTractionRoadmap: (data: Partial<TractionRoadmapData>) => void;
  setTokenomics: (data: Partial<TokenomicsData>) => void;
  setSocialMedia: (data: Partial<SocialMediaData>) => void;
  resetForm: () => void;
  getAllData: () => {
    basicInfo: Partial<BasicInfoData>;
    pitch: Partial<PitchData>;
    team: Partial<TeamData>;
    tractionRoadmap: Partial<TractionRoadmapData>;
    tokenomics: Partial<TokenomicsData>;
    socialMedia: Partial<SocialMediaData>;
  };
}

const initialState = {
  currentStep: 1,
  basicInfo: {
    totalSupply: '1000000',
    valuation: '1',
    percentageForSale: '',
    targetRaise: '',
  },
  pitch: {},
  team: {
    team: [],
  },
  tractionRoadmap: {
    traction: [],
    roadmap: [],
  },
  tokenomics: {
    tokenDistribution: [
      { category: 'Public Sale', percentage: 40, color: '#10b981' },
      { category: 'Founders', percentage: 20, color: '#3b82f6' },
      { category: 'Team', percentage: 15, color: '#8b5cf6' },
      { category: 'Advisors', percentage: 5, color: '#f59e0b' },
      { category: 'Future Rounds', percentage: 20, color: '#6b7280' },
    ],
    useOfFunds: [
      { category: 'Engineering', percentage: 40, amount: 0 },
      { category: 'Sales & Marketing', percentage: 30, amount: 0 },
      { category: 'Operations', percentage: 20, amount: 0 },
      { category: 'Legal & Compliance', percentage: 10, amount: 0 },
    ],
  },
  socialMedia: {
    sliderImages: ['', '', ''],
    tweetIds: [],
  },
};

export const useCreateCoinStore = create<CreateCoinStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setBasicInfo: (data) => 
        set((state) => ({ 
          basicInfo: { ...state.basicInfo, ...data } 
        })),
      
      setPitch: (data) => 
        set((state) => ({ 
          pitch: { ...state.pitch, ...data } 
        })),
      
      setTeam: (data) => 
        set((state) => ({ 
          team: { ...state.team, ...data } 
        })),
      
      setTractionRoadmap: (data) => 
        set((state) => ({ 
          tractionRoadmap: { ...state.tractionRoadmap, ...data } 
        })),
      
      setTokenomics: (data) => 
        set((state) => ({ 
          tokenomics: { ...state.tokenomics, ...data } 
        })),
      
      setSocialMedia: (data) => 
        set((state) => ({ 
          socialMedia: { ...state.socialMedia, ...data } 
        })),
      
      resetForm: () => set(initialState),
      
      getAllData: () => {
        const state = get();
        return {
          basicInfo: state.basicInfo,
          pitch: state.pitch,
          team: state.team,
          tractionRoadmap: state.tractionRoadmap,
          tokenomics: state.tokenomics,
          socialMedia: state.socialMedia,
        };
      },
    }),
    {
      name: 'create-coin-draft',
      // Auto-save to localStorage
    }
  )
);

