'use client';

import { cn } from '@/lib/utils';

interface AILoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function AILoadingSkeleton({ className, lines = 4 }: AILoadingSkeletonProps) {
  // Varying widths for a more natural look
  const widths = ['w-full', 'w-[95%]', 'w-[90%]', 'w-[85%]', 'w-full', 'w-[92%]'];

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]',
            widths[i % widths.length]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}


