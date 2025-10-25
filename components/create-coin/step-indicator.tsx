'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop Horizontal Layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted || isCurrent;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step.number)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all group',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'bg-background border-primary text-primary ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted border-border text-muted-foreground',
                    isClickable && 'group-hover:scale-105'
                  )}
                >
                  {isCompleted ? <Check size={20} /> : step.number}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent && 'text-foreground',
                      isCompleted && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground hidden lg:block">
                    {step.description}
                  </div>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative top-[-24px]">
                  <div className="w-full h-full bg-border">
                    <div
                      className={cn(
                        'h-full bg-primary transition-all duration-500',
                        isCompleted ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Compact Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
            <div className="text-sm font-semibold mt-1">
              {steps.find(s => s.number === currentStep)?.title}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

