'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, MessageCircle, ArrowUpDown } from 'lucide-react';
import { StartupData } from '@/types/startup';
import { shortenAddress, timeAgo, formatNumber } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type SortField = 'age' | 'type' | 'amount' | 'total' | 'trader';
type SortDirection = 'asc' | 'desc';

interface ActivityFeedProps {
  startup: StartupData;
  launchpadPubkey?: string;
}

type FeedTab = 'trades' | 'comments';

export function ActivityFeed({ startup, launchpadPubkey }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('trades');
  const [realTrades, setRealTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch real trades data when launchpadPubkey is available
  useEffect(() => {
    if (launchpadPubkey) {
      setLoading(true);
      fetch(`/api/trades/${launchpadPubkey}`)
        .then(res => res.json())
        .then(data => {
          // Check if data is an array (not an error object)
          if (Array.isArray(data)) {
            // Convert timestamp strings back to Date objects
            const tradesWithDates = data.map((trade: any) => ({
              ...trade,
              timestamp: new Date(trade.timestamp)
            }));
            setRealTrades(tradesWithDates);
          } else {
            console.error('Trades API returned non-array data:', data);
            setRealTrades([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch trades:', err);
          setRealTrades([]);
          setLoading(false);
        });
    }
  }, [launchpadPubkey]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border px-3 bg-background">
        <button
          onClick={() => setActiveTab('trades')}
          className={cn(
            'px-0 py-2 text-xs font-medium transition-colors relative',
            activeTab === 'trades'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Trades
          {activeTab === 'trades' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            'px-0 py-2 text-xs font-medium transition-colors relative',
            activeTab === 'comments'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Comments
          {activeTab === 'comments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'trades' && (
          <TradesTab 
            trades={launchpadPubkey ? realTrades : startup.recentTrades} 
            ticker={startup.ticker}
            loading={loading}
          />
        )}
        {activeTab === 'comments' && (
          <div className="px-4 py-2 space-y-2">
            <CommentsTab comments={startup.comments} />
          </div>
        )}
      </div>
    </div>
  );
}

function TradesTab({ trades, ticker, loading }: { trades: any[]; ticker: string; loading?: boolean }) {
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'age':
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * direction;
      case 'type':
        return (a.type === 'buy' ? 1 : -1) * direction;
      case 'amount':
        return (a.amount - b.amount) * direction;
      case 'total':
        return (a.total - b.total) * direction;
      case 'trader':
        return a.wallet.localeCompare(b.wallet) * direction;
      default:
        return 0;
    }
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown size={12} className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity',
        sortField === field && 'opacity-100'
      )} />
    </button>
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-5 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border group">
          <SortableHeader field="age">Age</SortableHeader>
          <SortableHeader field="type">Type</SortableHeader>
          <SortableHeader field="amount">Amount</SortableHeader>
          <SortableHeader field="total">Total USD</SortableHeader>
          <SortableHeader field="trader">Trader</SortableHeader>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading trades...
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-5 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border group">
          <SortableHeader field="age">Age</SortableHeader>
          <SortableHeader field="type">Type</SortableHeader>
          <SortableHeader field="amount">Amount</SortableHeader>
          <SortableHeader field="total">Total USD</SortableHeader>
          <SortableHeader field="trader">Trader</SortableHeader>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No trades yet
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border group">
        <SortableHeader field="age">Age</SortableHeader>
        <SortableHeader field="type">Type</SortableHeader>
        <SortableHeader field="amount">Amount</SortableHeader>
        <SortableHeader field="total">Total USD</SortableHeader>
        <SortableHeader field="trader">Trader</SortableHeader>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {sortedTrades.map((trade, index) => (
          <div
            key={trade.id}
            className={cn(
              "grid grid-cols-5 gap-4 px-3 py-3 text-xs hover:bg-accent/10 transition-colors items-center",
              index % 2 === 0 ? "bg-background" : "bg-muted/20"
            )}
          >
            {/* Age */}
            <div className="text-muted-foreground">
              {timeAgo(trade.timestamp)}
            </div>

            {/* Type */}
            <div className={cn(
              'font-medium',
              trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
            )}>
              {trade.type === 'buy' ? 'Buy' : 'Sell'}
            </div>

            {/* Amount */}
            <div className="text-foreground">
              {formatNumber(trade.amount, 2)}
            </div>

            {/* Total USD */}
            <div className={cn(
              'font-medium',
              trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
            )}>
              ${trade.total < 0.01 ? trade.total.toFixed(4) : trade.total.toFixed(2)}
            </div>

            {/* Trader */}
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-mono">
                {shortenAddress(trade.wallet)}
              </span>
              <button className="opacity-0 hover:opacity-100 transition-opacity">
                <ArrowUpRight size={12} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsTab({ comments }: { comments: StartupData['comments'] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p>No comments yet</p>
        <p className="text-xs mt-1">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 bg-card hover:bg-accent/5 rounded-lg border border-border/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users size={12} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{comment.user}</div>
                <div className="text-xs text-muted-foreground">
                  {shortenAddress(comment.wallet)}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {timeAgo(comment.timestamp)}
            </div>
          </div>
          <p className="text-sm text-foreground/90 mb-2">{comment.content}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button className="hover:text-foreground transition-colors">
              👍 {comment.likes}
            </button>
            <button className="hover:text-foreground transition-colors">
              Reply
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

