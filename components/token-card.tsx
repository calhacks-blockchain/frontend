'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Copy, Search, Users, TrendingUp, TrendingDown, Activity, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenData {
  id: string;
  name: string;
  ticker: string;
  image: string;
  marketCap: string;
  price: string;
  volume: string;
  timeAgo: string;
  holders: number;
  txCount: number;
  liquidity: string;
  fdv: string;
  buyPressure: number;
  sellPressure: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
}

interface TokenCardProps {
  token: TokenData;
  className?: string;
}

export function TokenCard({ token, className }: TokenCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <Link
      href={`/coin/${token.id}`}
      className={cn(
        'relative bg-card border-t border-border/50 p-3 hover:bg-accent/5 transition-colors cursor-pointer block',
        className
      )}
    >
      {/* Main Content */}
      <div className="flex gap-3">
        {/* Token Image */}
        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
          {(() => {
            // Debug logging
            console.log('Token image value:', token.image, 'Type:', typeof token.image);
            
            // More strict validation - check for valid URL patterns
            const isValidImage = token.image && 
              typeof token.image === 'string' && 
              token.image.trim() !== '' && 
              token.image !== 'null' &&
              token.image !== 'undefined' &&
              (token.image.startsWith('http://') || 
               token.image.startsWith('https://') || 
               token.image.startsWith('/'));
            
            if (isValidImage) {
              // Use regular img tag to avoid Next.js URL construction issues
              return (
                <img
                  src={token.image}
                  alt={token.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide the image and show fallback on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium';
                      fallback.textContent = token.ticker;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              );
            }
            
            // Fallback to ticker
            return (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                {token.ticker}
              </div>
            );
          })()}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{token.name}</h3>
                <span className="text-xs text-muted-foreground">{token.ticker}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{token.timeAgo}</span>
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={12} />
                </button>
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search size={12} />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">MC ${token.marketCap}</div>
              <div className="text-sm font-medium">V ${token.price}</div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs mb-2">
            <div className="flex items-center gap-1">
              <Users size={12} className="text-muted-foreground" />
              <span>{formatNumber(token.holders)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity size={12} className="text-muted-foreground" />
              <span>{token.txCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={12} className="text-muted-foreground" />
              <span>${token.liquidity}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">F</span>
              <span className="text-primary">${token.fdv}</span>
            </div>
          </div>

          {/* Bottom Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className={cn('flex items-center gap-1', getPriceChangeColor(token.priceChange5m))}>
              {token.priceChange5m > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(token.priceChange5m)}%</span>
              <span className="text-muted-foreground">5m</span>
            </div>
            <div className={cn('flex items-center gap-1', getPriceChangeColor(token.priceChange1h))}>
              {token.priceChange1h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(token.priceChange1h)}%</span>
              <span className="text-muted-foreground">1h</span>
            </div>
            <div className={cn('flex items-center gap-1', getPriceChangeColor(token.priceChange6h))}>
              {token.priceChange6h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(token.priceChange6h)}%</span>
              <span className="text-muted-foreground">6h</span>
            </div>
            <div className={cn('flex items-center gap-1', getPriceChangeColor(token.priceChange24h))}>
              {token.priceChange24h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(token.priceChange24h)}%</span>
              <span className="text-muted-foreground">24h</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

