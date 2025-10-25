'use client';

import { TokenCard, TokenData } from './token-card';
import { cn } from '@/lib/utils';

interface TokenColumnProps {
  title: string;
  count: number;
  tokens: TokenData[];
  badges?: string[];
  position?: 'left' | 'middle' | 'right';
  className?: string;
}

export function TokenColumn({ title, count, tokens, badges, position = 'left', className }: TokenColumnProps) {
  const roundedClass = position === 'left' ? 'rounded-l-lg' : position === 'right' ? 'rounded-r-lg' : '';
  
  return (
    <div className={cn('flex flex-col h-full border border-border/50 overflow-hidden', roundedClass, className)}>
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="text-primary">⚡</span>
            <span>{count}</span>
          </div>
          {badges && badges.length > 0 && (
            <div className="flex items-center gap-1">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Token List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {tokens.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>
    </div>
  );
}

