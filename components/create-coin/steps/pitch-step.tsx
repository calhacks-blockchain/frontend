'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { pitchSchema, type PitchData } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft } from 'lucide-react';

interface PitchStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PitchStep({ onNext, onBack }: PitchStepProps) {
  const { pitch, setPitch } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PitchData, value: string) => {
    setPitch({ [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = pitchSchema.safeParse(pitch);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">The Pitch</h2>
        <p className="text-muted-foreground">
          Tell investors your story. What problem are you solving and why now?
        </p>
      </div>

      <div className="space-y-5">
        {/* Elevator Pitch */}
        <div className="space-y-2">
          <label htmlFor="elevatorPitch" className="text-sm font-medium">
            Elevator Pitch <span className="text-destructive">*</span>
          </label>
          <textarea
            id="elevatorPitch"
            placeholder="A concise overview of your business in 2-3 sentences..."
            value={pitch.elevatorPitch || ''}
            onChange={(e) => handleChange('elevatorPitch', e.target.value)}
            rows={4}
            maxLength={500}
            className={`w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.elevatorPitch ? 'border-destructive' : 'border-input'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            {pitch.elevatorPitch?.length || 0}/500 characters
          </p>
          {errors.elevatorPitch && (
            <p className="text-xs text-destructive">{errors.elevatorPitch}</p>
          )}
        </div>

        {/* Problem Statement */}
        <div className="space-y-2">
          <label htmlFor="problem" className="text-sm font-medium">
            The Problem <span className="text-destructive">*</span>
          </label>
          <textarea
            id="problem"
            placeholder="What problem are you solving? Why is it painful?"
            value={pitch.problem || ''}
            onChange={(e) => handleChange('problem', e.target.value)}
            rows={5}
            maxLength={1000}
            className={`w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.problem ? 'border-destructive' : 'border-input'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            {pitch.problem?.length || 0}/1000 characters
          </p>
          {errors.problem && (
            <p className="text-xs text-destructive">{errors.problem}</p>
          )}
        </div>

        {/* Solution */}
        <div className="space-y-2">
          <label htmlFor="solution" className="text-sm font-medium">
            Your Solution <span className="text-destructive">*</span>
          </label>
          <textarea
            id="solution"
            placeholder="How does your product/service solve this problem?"
            value={pitch.solution || ''}
            onChange={(e) => handleChange('solution', e.target.value)}
            rows={5}
            maxLength={1000}
            className={`w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.solution ? 'border-destructive' : 'border-input'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            {pitch.solution?.length || 0}/1000 characters
          </p>
          {errors.solution && (
            <p className="text-xs text-destructive">{errors.solution}</p>
          )}
        </div>

        {/* Why Now */}
        <div className="space-y-2">
          <label htmlFor="whyNow" className="text-sm font-medium">
            Why Now? <span className="text-destructive">*</span>
          </label>
          <textarea
            id="whyNow"
            placeholder="Why is now the right time for this solution? What's changed?"
            value={pitch.whyNow || ''}
            onChange={(e) => handleChange('whyNow', e.target.value)}
            rows={5}
            maxLength={1000}
            className={`w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.whyNow ? 'border-destructive' : 'border-input'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            {pitch.whyNow?.length || 0}/1000 characters
          </p>
          {errors.whyNow && (
            <p className="text-xs text-destructive">{errors.whyNow}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}

