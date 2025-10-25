'use client';

import { useState } from 'react';
import { Menu, Equal } from 'lucide-react';
import Image from 'next/image';
import { useAppKitAccount } from "@reown/appkit/react";
import { StartupData } from '@/types/startup';
import { cn } from '@/lib/utils';
import { formatCurrency, shortenAddress } from '@/lib/format-utils';

interface LiveMetrics {
  currentPriceSol: number;
  currentPriceUsd: number;
  marketCapSol: number;
  marketCapUsd: number;
  totalSupply: number;
  tokensSold: number;
  tokensRemaining: number;
  volume24h: number;
  volume7d: number;
  totalVolume: number;
  totalHolders: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  solRaised: number;
}

interface TradingPanelProps {
  startup: StartupData;
  onSwitchToCompany?: () => void;
  liveMetrics?: LiveMetrics | null;
  metricsLoading?: boolean;
}

type TradeType = 'buy' | 'sell';
type TimePeriod = '5m' | '1h' | '6h' | '24h';

export function TradingPanel({ startup, onSwitchToCompany, liveMetrics, metricsLoading }: TradingPanelProps) {
  const { address, isConnected } = useAppKitAccount();
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [amount, setAmount] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('5m');
  const [isTrading, setIsTrading] = useState(false);

  // Mock price changes for different time periods
  const priceChanges: Record<TimePeriod, number> = {
    '5m': 12.5,
    '1h': -3.62,
    '6h': 8.2,
    '24h': -8.69,
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsTrading(true);
    try {
      const walletPublicKey = address;

      // 2. Get launchpad address from startup data
      // Assuming startup.id or startup.launchpadAddress contains the launchpad pubkey
      const launchpadAddress = startup.id; // Adjust based on your data structure

      // 3. Build transaction
      const endpoint = tradeType === 'buy' ? '/api/buy-token' : '/api/sell-token';
      const solAmount = parseFloat(amount); // Keep as SOL, backend will convert to lamports

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          launchpadStateAddress: launchpadAddress,
          solAmount: solAmount.toString(),
          ...(tradeType === 'buy' 
            ? { buyer: walletPublicKey }
            : { seller: walletPublicKey }
          ),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to build transaction');
      }

      const { instruction } = await response.json();

      // 4. Build and send transaction
      const { Connection, Transaction, TransactionInstruction, PublicKey } = await import('@solana/web3.js');
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      console.log("Instruction:", instruction);

      const ix = new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.keys.map((k: any) => ({
          pubkey: new PublicKey(k.pubkey),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        data: Buffer.from(instruction.data, 'base64'),
      });

      const transaction = new Transaction();
      transaction.add(ix);

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletPublicKey);

      // Sign with wallet provider
      const provider = (window as any).solana;
      if (!provider) {
        throw new Error('Wallet provider not found');
      }
      const signedTx = await provider.signTransaction(transaction);

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Transaction signature:', signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature);

      // Success!
      alert(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${startup.ticker}!`);
      setAmount('');

      // Refresh page data
      window.location.reload();
    } catch (error) {
      console.error('Trade error:', error);
      alert(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Calculate progress percentage using live metrics if available
  const solRaised = liveMetrics?.solRaised ?? startup.raised;
  const goal = startup.goal; // Goal is static from startup data
  const progressPercentage = (solRaised / goal) * 100;

  return (
    <div className="bg-background text-foreground">
      {/* Time Period Stats */}
      <div className="grid grid-cols-4 border-b border-border bg-background">
        {(['5m', '1h', '6h', '24h'] as TimePeriod[]).map((period) => {
          const change = priceChanges[period];
          const isPositive = change >= 0;
          return (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'py-3 flex flex-col items-center justify-center transition-colors border-b-2 cursor-pointer',
                selectedPeriod === period
                  ? 'border-muted bg-muted/50'
                  : 'border-transparent hover:bg-muted/30'
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">{period}</div>
              <div className={cn(
                'text-sm font-medium',
                isPositive ? 'text-primary' : 'text-destructive'
              )}>
                {isPositive ? '+' : ''}{change}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Buy/Sell Toggle */}
      <div className="p-4 bg-background">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTradeType('buy')}
            className={cn(
              'py-2.5 text-sm font-medium rounded transition-all cursor-pointer',
              tradeType === 'buy'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={cn(
              'py-2.5 text-sm font-medium rounded transition-all cursor-pointer',
              tradeType === 'sell'
                ? 'bg-destructive text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              AMOUNT
            </label>
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                <Menu size={14} />
              </button>
              <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                <Equal size={14} />
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-card border border-input rounded px-3 py-2.5 pr-10 text-base focus:outline-none focus:border-ring placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Image
                src="/solana-sol-logo.svg"
                alt="Solana"
                width={20}
                height={20}
                className="opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[0.01, 0.1, 1, 10].map((value) => (
            <button
              key={value}
              onClick={() => handleQuickAmount(value)}
              className="py-2 text-xs font-medium bg-muted hover:bg-muted/80 rounded transition-colors cursor-pointer"
            >
              {value}
            </button>
          ))}
        </div>

        {/* Main Action Button */}
        <button
          onClick={() => handleTrade()}
          className={cn(
            'w-full py-3 text-base font-semibold rounded transition-all',
            tradeType === 'buy'
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-destructive hover:bg-destructive/90 text-white',
            (!amount || parseFloat(amount) <= 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          {tradeType === 'buy' ? 'Buy' : 'Sell'} {startup.ticker}
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Bonding Curve Progress */}
      <div className="p-4 bg-background">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Bonding Curve Progress</h3>
            <span className="text-xs text-muted-foreground">{progressPercentage.toFixed(1)}%</span>
          </div>
          
          {/* Progress Bar with Gradient Animation */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">
              {metricsLoading ? 'Loading...' : `${formatCurrency(solRaised, 0)} raised`}
            </span>
            <span className="text-muted-foreground">Goal: {formatCurrency(goal, 0)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {metricsLoading ? 'Loading...' : `${formatCurrency(goal - solRaised, 0)} remaining until graduation`}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Company Summary */}
      <div className="p-4 bg-background">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
            <Image
              src={startup.logo}
              alt={startup.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">{startup.name}</h3>
            <p className="text-xs text-muted-foreground">{startup.tagline}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {startup.elevatorPitch}
        </p>
        {onSwitchToCompany && (
          <button
            onClick={onSwitchToCompany}
            className="text-xs text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors"
          >
            Find out more →
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Top Holders */}
      <div className="p-4 bg-background">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Top holders</h3>
          {startup.topHolders[0]?.wallet && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Liquidity pool</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {startup.topHolders.slice(0, 10).map((holder, index) => (
            <div key={holder.wallet} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {index === 0 && (
                  <div className="w-3 h-3 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path
                        d="M12 2L13.5 8.5H20L15 12.5L17 19L12 15L7 19L9 12.5L4 8.5H10.5L12 2Z"
                        fill="currentColor"
                        className="text-primary"
                      />
                    </svg>
                  </div>
                )}
                <span className="font-mono text-muted-foreground truncate">
                  {shortenAddress(holder.wallet)}
                </span>
              </div>
              <span className="text-foreground font-medium ml-2">
                {holder.percentage.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

