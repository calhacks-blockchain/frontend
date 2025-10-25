'use client';

import { cn } from '@/lib/utils';
import { AIWritingAssistant } from './ai-writing-assistant';

interface TextareaWithAIProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  contextData?: Record<string, string>;
  fieldLabel: string;
  error?: string;
  enableAI?: boolean;
}

export function TextareaWithAI({
  value,
  onChange,
  maxLength,
  contextData,
  fieldLabel,
  error,
  enableAI = true,
  className,
  disabled,
  ...props
}: TextareaWithAIProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm resize-none',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          error ? 'border-destructive' : 'border-input',
          className
        )}
        {...props}
      />
      {enableAI && (
        <AIWritingAssistant
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          contextData={contextData}
          fieldLabel={fieldLabel}
          disabled={disabled}
        />
      )}
    </div>
  );
}

