'use client';

import { StartupData } from '@/types/startup';
import { formatCurrency, estimateDaysToGoal } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

interface FundraisingProgressProps {
  startup: StartupData;
}

export function FundraisingProgress({ startup }: FundraisingProgressProps) {
  const progress = Math.min((startup.raised / startup.goal) * 100, 100);
  const isGraduated = progress >= 100;

  return (
    <div>
      <div>
          {/* Progress Info */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Fundraising Progress
              </h3>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(startup.raised, 0)} raised
                <span className="text-muted-foreground text-lg ml-2">
                  of {formatCurrency(startup.goal, 0)} goal
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Equity Offered</div>
              <div className="text-2xl font-bold text-primary">{startup.equityOffered}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-8 bg-muted rounded-lg overflow-hidden mb-3">
            {/* Fill */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 transition-all duration-500 ease-out',
                isGraduated
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                  : 'bg-gradient-to-r from-primary to-blue-400'
              )}
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            {/* Percentage Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground mix-blend-difference">
                {progress.toFixed(1)}% {isGraduated ? 'GRADUATED! 🎉' : 'to graduation'}
              </span>
            </div>

            {/* Goal marker */}
            {!isGraduated && (
              <div
                className="absolute inset-y-0 w-1 bg-white/50"
                style={{ left: '100%' }}
              />
            )}
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              <span className="font-medium">{startup.holders}</span> investors
              <span className="mx-2">•</span>
              <span className="font-medium">{startup.daysActive}</span> days active
            </div>
            <div>
              {isGraduated ? (
                <span className="text-green-500 font-medium">
                  Ready to convert to equity!
                </span>
              ) : (
                <>
                  Est. time to goal:{' '}
                  <span className="font-medium">
                    {estimateDaysToGoal(startup.raised, startup.goal, startup.daysActive)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Graduation Notice */}
          {isGraduated && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-xl">🎓</div>
                <div>
                  <h4 className="font-semibold text-green-500 mb-1 text-sm">
                    Goal Reached!
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tokens will convert to {startup.equityOffered}% equity via SAFE.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

