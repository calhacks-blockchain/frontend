'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { StartupData, PriceDataPoint } from '@/types/startup';
import TradingChart from './trading-chart';
import { TradingPanel } from './trading-panel';
import { ActivityFeed } from './activity-feed';
import { formatNumber } from '@/lib/format-utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface TradingTabProps {
  startup: StartupData;
  priceHistory: PriceDataPoint[];
  onSwitchToCompany?: () => void;
}

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

export function TradingTab({ startup, priceHistory, onSwitchToCompany }: TradingTabProps) {
  const [copied, setCopied] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch live metrics from the combined metrics API
  const fetchLiveMetrics = async () => {
    if (!startup.contractAddress) return;
    
    setMetricsLoading(true);
    try {
      const response = await fetch(`/api/metrics/${startup.contractAddress}`);
      if (response.ok) {
        const data = await response.json();
        setLiveMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch live metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fetch status from the status API
  const fetchStatus = async () => {
    if (!startup.contractAddress) return;
    
    setStatusLoading(true);
    try {
      const response = await fetch(`/api/status/${startup.contractAddress}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch live metrics on component mount and set up polling
  useEffect(() => {
    fetchLiveMetrics();
    
    // Poll for metrics updates every 15 seconds
    const interval = setInterval(fetchLiveMetrics, 15000);
    
    return () => clearInterval(interval);
  }, [startup.contractAddress]);

  // Fetch status on component mount and set up polling
  useEffect(() => {
    fetchStatus();
    
    // Poll for status updates every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    
    return () => clearInterval(interval);
  }, [startup.contractAddress]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(startup.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use live metrics if available, otherwise fall back to startup data
  const currentPrice = liveMetrics?.currentPriceSol ?? startup.price;
  const marketCap = liveMetrics?.marketCapUsd ?? startup.marketCap;
  const volume24h = liveMetrics?.volume24h ?? startup.volume24h;
  const totalSupply = liveMetrics?.totalSupply ?? startup.totalSupply;
  const holders = liveMetrics?.totalHolders ?? startup.holders;

  return (
    <div className="h-full w-full flex">
      {/* Left Panel: Main Content */}
      <div className="flex-1 h-full border-r border-border">
        <div className="h-full flex flex-col">
          {/* Company Header with Trading Info */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-background">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border-2 border-primary">
                <Image
                  src={startup.logo}
                  alt={startup.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold leading-none">{startup.name}</h1>
                  <span className="text-sm text-muted-foreground leading-none">{startup.ticker}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">{startup.daysActive}d</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-foreground transition-colors font-mono"
                  >
                    {startup.contractAddress.slice(0, 4)}...{startup.contractAddress.slice(-4)}
                    {copied ? (
                      <Check size={10} className="text-primary" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trading Stats */}
            <div className="flex items-center gap-6 text-xs">
              {/* Market Cap */}
              <div>
                <span className="text-muted-foreground">Market Cap </span>
                <span className="font-semibold text-foreground text-base">
                  ${formatNumber(marketCap, 1)}
                </span>
                {liveMetrics && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>

              {/* Price */}
              <div>
                <span className="text-muted-foreground">Price </span>
                <span className="font-medium text-foreground">
                  ${currentPrice < 0.001 ? currentPrice.toFixed(8) : currentPrice < 0.01 ? currentPrice.toFixed(6) : currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}
                </span>
                {liveMetrics && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>

              {/* Liquidity (Volume 24h) */}
              <div>
                <span className="text-muted-foreground">Volume 24h </span>
                <span className="font-medium text-foreground">
                  ${formatNumber(volume24h, 1)}
                </span>
                {liveMetrics && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>

              {/* Supply */}
              <div>
                <span className="text-muted-foreground">Supply </span>
                <span className="font-medium text-foreground">
                  {formatNumber(totalSupply, 0)}
                </span>
                {liveMetrics && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>

              {/* Holders */}
              <div>
                <span className="text-muted-foreground">Holders </span>
                <span className="font-medium text-foreground">
                  {formatNumber(holders, 0)}
                </span>
                {liveMetrics && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>

              {/* Status */}
              <div>
                <span className="text-muted-foreground">Status </span>
                <span className="font-medium text-foreground capitalize">
                  {status ? (
                    status.toLowerCase() === 'safe' ? 'Safe (coin graduated)' : status
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </span>
                {status && (
                  <span className="text-xs text-green-500 ml-1">●</span>
                )}
              </div>
            </div>
          </div>

          {/* Resizable Chart and Trades */}
          <ResizablePanelGroup direction="vertical" className="flex-1">
            {/* DEXScreener Chart */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <TradingChart launchpadPubkey={startup.contractAddress} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Trades/Activity Feed */}
            <ResizablePanel defaultSize={40} minSize={20}>
              <ActivityFeed startup={startup} launchpadPubkey={startup.contractAddress} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Right Panel: Trading Interface */}
      <div className="w-[332px] h-full overflow-y-auto">
        <TradingPanel 
          startup={startup} 
          onSwitchToCompany={onSwitchToCompany}
          liveMetrics={liveMetrics}
          metricsLoading={metricsLoading}
        />
      </div>
    </div>
  );
}

