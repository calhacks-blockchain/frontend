'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  className?: string;
}

export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ value, onChange, length = 6, className }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    
    const handleChange = (index: number, newValue: string) => {
      // Only allow single digit
      const digit = newValue.slice(-1);
      if (digit && !/^\d$/.test(digit)) return;
      
      const newOtp = value.split('');
      newOtp[index] = digit;
      onChange(newOtp.join(''));
      
      // Auto-focus next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };
    
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          // Focus previous input if current is empty
          inputRefs.current[index - 1]?.focus();
        } else {
          // Clear current input
          const newOtp = value.split('');
          newOtp[index] = '';
          onChange(newOtp.join(''));
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };
    
    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
      if (/^\d+$/.test(pastedData)) {
        onChange(pastedData.padEnd(length, ''));
        // Focus the last filled input
        const nextIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
      }
    };
    
    return (
      <div ref={ref} className={cn('flex items-center justify-center gap-2', className)}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'w-12 h-14 text-center text-lg font-semibold',
              'bg-input border border-border rounded-lg',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-0 focus:border-primary',
              'hover:border-muted-foreground/20',
              'transition-colors'
            )}
          />
        ))}
      </div>
    );
  }
);

OtpInput.displayName = 'OtpInput';

