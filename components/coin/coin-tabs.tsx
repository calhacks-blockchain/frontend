'use client';

import { cn } from '@/lib/utils';

export type TabValue = 'trading' | 'company' | 'documents';

interface CoinTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabs = [
  { value: 'trading' as const, label: 'Trading' },
  { value: 'company' as const, label: 'Company Info' }
];

export function CoinTabs({ activeTab, onTabChange }: CoinTabsProps) {
  return (
    <div className="border-b border-border bg-card/30">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'relative px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer',
              'hover:text-foreground',
              activeTab === tab.value
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {tab.label}
            
            {/* Active indicator */}
            {activeTab === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


