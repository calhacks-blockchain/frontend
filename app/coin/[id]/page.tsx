'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar04 } from '@/components/ui/shadcn-io/navbar-04';
import { CoinTabs, TabValue } from '@/components/coin/coin-tabs';
import { TradingTab } from '@/components/coin/trading-tab';
import { CompanyTab } from '@/components/coin/company-tab';
import { getStartupById, generatePriceHistory } from '@/lib/mock-startups';
import { StartupData, PriceDataPoint } from '@/types/startup';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ToastProvider } from '@/components/ui/toast';

function CoinPage() {
  const params = useParams();
  const router = useRouter();
  const { openLogin, openSignup, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('trading');
  const [startup, setStartup] = useState<StartupData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLaunchpadData = async () => {
      try {
        const launchpadPubkey = params.id as string;
        
        // Fetch launchpad state
        const launchpadResponse = await fetch(`/api/launchpad/${launchpadPubkey}`);
        if (!launchpadResponse.ok) {
          console.error('Failed to fetch launchpad data');
          // Fallback to mock data
          const baseId = launchpadPubkey.split('-')[0];
          const data = getStartupById(baseId);
          if (data) {
            setStartup(data);
            setPriceHistory(generatePriceHistory(data.price, 30));
          }
          setLoading(false);
          return;
        }

        const launchpadData = await launchpadResponse.json();

        // Fetch metadata from the URI
        let metadata = null;
        let logoUrl = '/bitcoin-btc-logo.svg'; // Default fallback
        let description = 'A revolutionary token on the Solana blockchain';
        
        if (launchpadData.uri) {
          try {
            // Extract the token URI ID from the full URI
            // URI format: http://localhost:3000/api/metadata/{tokenUriId}
            const uriParts = launchpadData.uri.split('/');
            const tokenUriId = uriParts[uriParts.length - 1];
            
            const metadataResponse = await fetch(`/api/metadata/${tokenUriId}`);
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json();
              logoUrl = metadata.image || logoUrl;
              description = metadata.description || description;
            }
          } catch (metadataError) {
            console.error('Error fetching metadata:', metadataError);
          }
        }

        // Fetch current price
        const priceResponse = await fetch(`/api/current-price/${launchpadPubkey}`);
        let currentPrice = 0;
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          currentPrice = priceData.currentPriceSol || 0;
        }

        // Fetch OHLCV data for chart
        const ohlcvResponse = await fetch(`/api/ohlcv/${launchpadPubkey}?interval=1h`);
        let chartData: PriceDataPoint[] = [];
        if (ohlcvResponse.ok) {
          const { candles: ohlcvData } = await ohlcvResponse.json();
          chartData = ohlcvData.map((candle: any) => ({
            timestamp: new Date(candle.time).getTime(),
            price: candle.close,
            volume: candle.volume,
          }));
        }

        // If no OHLCV data, generate mock data
        if (chartData.length === 0) {
          chartData = generatePriceHistory(currentPrice || 100, 30);
        }

        // Fetch campaign data (company info)
        let campaignData = null;
        try {
          const campaignResponse = await fetch(`/api/campaign/${launchpadPubkey}`);
          if (campaignResponse.ok) {
            campaignData = await campaignResponse.json();
          }
        } catch (error) {
          console.error('Error fetching campaign data:', error);
        }

        // Convert launchpad data to StartupData format
        const startupData: StartupData = {
          id: launchpadPubkey,
          name: campaignData?.name || launchpadData.raiseTokenName || 'Unknown Token',
          ticker: campaignData?.symbol || launchpadData.raiseTokenSymbol || 'UNKNOWN',
          logo: campaignData?.logo_url || logoUrl,
          tagline: campaignData?.tagline || metadata?.name || launchpadData.raiseTokenName || 'Decentralized token on Solana',
          elevatorPitch: campaignData?.elevator_pitch || description,
          price: currentPrice,
          priceChange24h: 0,
          marketCap: 0,
          volume24h: 0,
          holders: 0,
          totalSupply: parseFloat(launchpadData.totalSupply || '0') / 1e9,
          raised: parseFloat(launchpadData.solRaised || '0') / 1e9, // Convert lamports to SOL
          goal: campaignData?.fundraising_goal || parseFloat(launchpadData.tokensForSale || '1000000000000000') / 1e9,
          equityOffered: campaignData?.equity_offered || 0,
          founderAllocation: campaignData?.founder_allocation || 0,
          created: campaignData?.created_at ? new Date(campaignData.created_at) : new Date(),
          daysActive: campaignData?.created_at ? Math.floor((Date.now() - new Date(campaignData.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          founder: {
            name: 'Unknown',
            wallet: launchpadData.authority || '',
          },
          contractAddress: params.id as string,
          blockchain: 'solana',
          website: campaignData?.website_url || '',
          twitter: campaignData?.twitter_url || '',
          discord: campaignData?.discord_url || '',
          telegram: campaignData?.telegram_url || '',
          problem: campaignData?.problem || '',
          solution: campaignData?.solution || '',
          whyNow: campaignData?.why_now || '',
          traction: campaignData?.traction_metrics || [],
          roadmap: campaignData?.roadmap_items || [],
          team: campaignData?.team_members || [],
          tokenDistribution: campaignData?.token_distribution || [],
          useOfFunds: campaignData?.use_of_funds || [],
          sliderImages: campaignData?.slider_images || [],
          tweetIds: campaignData?.tweet_ids || [],
          hasGraduated: !launchpadData.isActive,
          topHolders: [],
          recentTrades: [],
          comments: [],
        };

        setStartup(startupData);
        setPriceHistory(chartData);
      } catch (error) {
        console.error('Error fetching launchpad data:', error);
        // Fallback to mock data
        const baseId = (params.id as string).split('-')[0];
        const data = getStartupById(baseId);
        if (data) {
          setStartup(data);
          setPriceHistory(generatePriceHistory(data.price, 30));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLaunchpadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading startup data...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="w-full h-screen bg-background flex flex-col">
        <Navbar04 
          user={user}
          onSignInClick={openLogin}
          onSignUpClick={openSignup}
          onLogoutClick={logout}
          onCreateCoinClick={() => router.push('/create')}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Startup Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The startup you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
      <Navbar04 
        user={user}
        onSignInClick={openLogin}
        onSignUpClick={openSignup}
        onLogoutClick={logout}
        onCreateCoinClick={() => router.push('/create')}
      />

      <div className="border-b border-border">
        <CoinTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'trading' && (
          <TradingTab 
            startup={startup} 
            priceHistory={priceHistory}
            onSwitchToCompany={() => setActiveTab('company')}
          />
        )}
        {activeTab === 'company' && (
          <CompanyTab startup={startup} />
        )}
      </main>

      <SignUpDialog />
      <LoginDialog />
    </div>
  );
}

export default function CoinPageWrapper() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CoinPage />
      </AuthProvider>
    </ToastProvider>
  );
}

