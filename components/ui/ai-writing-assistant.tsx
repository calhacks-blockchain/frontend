'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, FileCheck, RefreshCw, PenLine, ArrowLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AILoadingSkeleton } from './ai-loading-skeleton';

type Action = 'proofread' | 'rewrite' | 'compose';
type View = 'menu' | 'compose' | 'review';

interface AIWritingAssistantProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  contextData?: Record<string, string>;
  fieldLabel: string;
  disabled?: boolean;
}

export function AIWritingAssistant({
  value,
  onChange,
  maxLength,
  contextData,
  fieldLabel,
  disabled,
}: AIWritingAssistantProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [composePrompt, setComposePrompt] = useState('');

  const handleAction = async (action: Action, prompt?: string) => {
    setCurrentAction(action);
    setIsLoading(true);
    setError('');
    setView('review');

    try {
      const response = await fetch('/api/ai/write-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          text: value,
          prompt,
          context: {
            fieldLabel,
            ...contextData,
          },
          maxLength,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestion');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSuggestion('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    onChange(suggestion);
    setPopoverOpen(false);
    resetState();
  };

  const handleReject = () => {
    setPopoverOpen(false);
    resetState();
  };

  const handleBack = () => {
    setView('menu');
    setComposePrompt('');
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (composePrompt.trim()) {
      handleAction('compose', composePrompt);
      setComposePrompt('');
    }
  };

  const resetState = () => {
    setTimeout(() => {
      setView('menu');
      setSuggestion('');
      setError('');
      setCurrentAction(null);
      setComposePrompt('');
    }, 200);
  };

  const getActionLabel = () => {
    switch (currentAction) {
      case 'proofread':
        return 'Proofread';
      case 'rewrite':
        return 'Rewrite';
      case 'compose':
        return 'Compose';
      default:
        return 'AI Suggestion';
    }
  };

  const canProofreadOrRewrite = value.trim().length > 0;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
            'text-muted-foreground hover:text-primary hover:bg-primary/10',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="AI Writing Assistant"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-3 transition-all duration-200",
          view === 'menu' && "w-48",
          view === 'compose' && "w-80",
          view === 'review' && "w-96"
        )}
        align="end"
      >
        <div className="animate-in zoom-in-95 duration-200">
          {view === 'menu' && (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleAction('proofread')}
                disabled={!canProofreadOrRewrite}
              >
                <FileCheck className="w-4 h-4" />
                Proofread
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleAction('rewrite')}
                disabled={!canProofreadOrRewrite}
              >
                <RefreshCw className="w-4 h-4" />
                Rewrite
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => setView('compose')}
              >
                <PenLine className="w-4 h-4" />
                Compose
              </Button>
            </div>
          )}

          {view === 'compose' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-7 w-7 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Compose</span>
                </div>
              </div>
              <form onSubmit={handleComposeSubmit} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    What would you like to write about?
                  </label>
                  <Input
                    placeholder="e.g., How our AI streamlines hiring..."
                    value={composePrompt}
                    onChange={(e) => setComposePrompt(e.target.value)}
                    autoFocus
                    className="text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!composePrompt.trim()}
                    className="gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </Button>
                </div>
              </form>
            </div>
          )}

          {view === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{getActionLabel()}</span>
              </div>

              {isLoading ? (
                <div className="py-2">
                  <AILoadingSkeleton lines={4} />
                </div>
              ) : error ? (
                <div className="p-3 border border-destructive rounded-md bg-destructive/10">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="max-h-[200px] overflow-y-auto p-3 border rounded-md bg-muted/30">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">{suggestion}</p>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {suggestion.length}{maxLength ? ` / ${maxLength}` : ''} characters
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={isLoading || !!error || !suggestion}
                  className="gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

