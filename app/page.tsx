'use client';

import { useRouter } from 'next/navigation';
import { Navbar04 } from '@/components/ui/shadcn-io/navbar-04';
import { TokenColumn } from '@/components/token-column';
import { generateMockTokens } from '@/lib/mock-tokens';
import { useState, useEffect } from 'react';
import { TokenData } from '@/components/token-card';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ToastProvider } from '@/components/ui/toast';

function HomeContent() {
  const router = useRouter();
  const { openLogin, openSignup, user, logout } = useAuth();

  // Fetch real data from API
  const [newPairs, setNewPairs] = useState<TokenData[]>([]);
  const [finalStretch, setFinalStretch] = useState<TokenData[]>([]);
  const [migrated, setMigrated] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          console.warn('Failed to fetch tokens, using mock data');
          // Fallback to mock data
          setNewPairs(generateMockTokens(15));
          setFinalStretch(generateMockTokens(15));
          setMigrated(generateMockTokens(15));
          setIsLoading(false);
          return;
        }

        const { tokens, warning } = await response.json();

        // If there's a warning, log it
        if (warning) {
          console.warn('Token API warning:', warning);
        }

        // Convert tokens to TokenData format and categorize
        const tokenData: TokenData[] = tokens.map((token: any) => ({
          id: token.pubkey,
          name: token.name,
          ticker: token.symbol,
          image: token.image && token.image !== 'null' && token.image !== 'undefined' ? token.image : '/bitcoin-btc-logo.svg', // Use fetched image or default
          marketCap: `${(Number(token.solRaised || 0) / 1e9).toFixed(2)}`,
          price: `${token.currentPrice || 0}`,
          volume: `${token.totalVolume || 0}`,
          timeAgo: 'Just now',
          holders: token.holders || 0,
          txCount: token.tradeCount || 0,
          liquidity: `${token.totalVolume || 0}`,
          fdv: `${(Number(token.totalSupply || 0) / 1e9).toFixed(0)}`,
          buyPressure: 50,
          sellPressure: 50,
          priceChange5m: 0,
          priceChange1h: 0,
          priceChange6h: 0,
          priceChange24h: 0,
        }));

        // Categorize tokens based on volume/market cap
        // For now, split them evenly or use mock data
        if (tokenData.length === 0) {
          setNewPairs(generateMockTokens(15));
          setFinalStretch(generateMockTokens(15));
          setMigrated(generateMockTokens(15));
        } else {
          // Show all real tokens in the new pairs column
          setNewPairs(tokenData);
          setFinalStretch(generateMockTokens(15)); // Until we have real data
          setMigrated(generateMockTokens(15)); // Until we have real data
        }
      } catch (error) {
        console.warn('Error fetching tokens, using mock data:', error);
        // Fallback to mock data
        setNewPairs(generateMockTokens(15));
        setFinalStretch(generateMockTokens(15));
        setMigrated(generateMockTokens(15));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return (
    <div className="relative w-full h-screen bg-background flex flex-col overflow-hidden">
      <Navbar04
        user={user}
        onSignInClick={openLogin}
        onSignUpClick={openSignup}
        onLogoutClick={logout}
        onCreateCoinClick={() => router.push('/create')}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-screen-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
          {/* New Pairs Column */}
          <TokenColumn
            title="New Pairs"
            count={0}
            tokens={newPairs}
            badges={['P1', 'P2', 'P3']}
            position="left"
          />

          {/* Final Stretch Column */}
          <TokenColumn
            title="Final Stretch"
            count={0}
            tokens={finalStretch}
            badges={['P1', 'P2', 'P3']}
            position="middle"
          />

          {/* Migrated Column */}
          <TokenColumn
            title="Migrated"
            count={0}
            tokens={migrated}
            badges={['P1', 'P2', 'P3']}
            position="right"
          />
        </div>
      </main>

      {/* Auth Dialogs */}
      <SignUpDialog />
      <LoginDialog />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HomeContent />
      </AuthProvider>
    </ToastProvider>
  );
}
