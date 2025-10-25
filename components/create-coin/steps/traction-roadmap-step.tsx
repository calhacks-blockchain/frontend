'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tractionRoadmapSchema } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft, Plus, Trash2, TrendingUp } from 'lucide-react';
import type { TractionMetric, RoadmapItem } from '@/types/startup';
import { cn } from '@/lib/utils';

interface TractionRoadmapStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function TractionRoadmapStep({ onNext, onBack }: TractionRoadmapStepProps) {
  const { tractionRoadmap, setTractionRoadmap } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [traction, setTraction] = useState<Partial<TractionMetric>[]>(
    tractionRoadmap.traction && tractionRoadmap.traction.length > 0
      ? tractionRoadmap.traction
      : []
  );

  const [roadmap, setRoadmap] = useState<Partial<RoadmapItem>[]>(
    tractionRoadmap.roadmap && tractionRoadmap.roadmap.length > 0
      ? tractionRoadmap.roadmap
      : [
          { quarter: 'Q1 2024', status: 'completed' },
          { quarter: 'Q2 2024', status: 'in-progress' },
          { quarter: 'Q3 2024', status: 'planned' },
        ]
  );

  const handleAddTraction = () => {
    setTraction([...traction, {}]);
  };

  const handleRemoveTraction = (index: number) => {
    setTraction(traction.filter((_, i) => i !== index));
  };

  const handleTractionChange = (
    index: number,
    field: keyof TractionMetric,
    value: string | number
  ) => {
    const newTraction = [...traction];
    newTraction[index] = { ...newTraction[index], [field]: value };
    setTraction(newTraction);
  };

  const handleAddRoadmap = () => {
    setRoadmap([...roadmap, { status: 'planned' }]);
  };

  const handleRemoveRoadmap = (index: number) => {
    if (roadmap.length > 3) {
      setRoadmap(roadmap.filter((_, i) => i !== index));
    }
  };

  const handleRoadmapChange = (
    index: number,
    field: keyof RoadmapItem,
    value: string
  ) => {
    const newRoadmap = [...roadmap];
    newRoadmap[index] = { ...newRoadmap[index], [field]: value };
    setRoadmap(newRoadmap);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update store
    setTractionRoadmap({
      traction: traction as TractionMetric[],
      roadmap: roadmap as RoadmapItem[],
    });
    
    // Validate
    const result = tractionRoadmapSchema.safeParse({
      traction: traction.length > 0 ? traction : undefined,
      roadmap,
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Traction & Roadmap</h2>
        <p className="text-muted-foreground">
          Show your progress and future plans. Traction is optional but recommended.
        </p>
      </div>

      {/* Traction Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Traction Metrics (Optional)</h3>
            <p className="text-xs text-muted-foreground">
              Key metrics that demonstrate your growth
            </p>
          </div>
        </div>

        {traction.map((metric, index) => (
          <div
            key={index}
            className="p-4 bg-card border border-border rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Metric {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTraction(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  placeholder="e.g., Active Users"
                  value={metric.label || ''}
                  onChange={(e) => handleTractionChange(index, 'label', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <Input
                  placeholder="e.g., 1,234"
                  value={metric.value || ''}
                  onChange={(e) => handleTractionChange(index, 'value', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Growth % (Optional)</label>
                <Input
                  type="number"
                  placeholder="e.g., 45"
                  value={metric.change ?? ''}
                  onChange={(e) =>
                    handleTractionChange(index, 'change', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddTraction}
          className="w-full gap-2"
        >
          <Plus size={16} />
          Add Traction Metric
        </Button>
      </div>

      {/* Roadmap */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Roadmap <span className="text-destructive">*</span></h3>
          <p className="text-xs text-muted-foreground">
            At least 3 milestones (minimum 3 required)
          </p>
        </div>

        {roadmap.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-card border border-border rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Milestone {index + 1}</span>
              {roadmap.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRoadmap(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quarter</label>
                <Input
                  placeholder="e.g., Q1 2024"
                  value={item.quarter || ''}
                  onChange={(e) => handleRoadmapChange(index, 'quarter', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={item.status || 'planned'}
                  onChange={(e) => handleRoadmapChange(index, 'status', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Launch MVP"
                value={item.title || ''}
                onChange={(e) => handleRoadmapChange(index, 'title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Brief description of this milestone..."
                value={item.description || ''}
                onChange={(e) => handleRoadmapChange(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddRoadmap}
          className="w-full gap-2"
        >
          <Plus size={16} />
          Add Milestone
        </Button>

        {errors.roadmap && (
          <p className="text-xs text-destructive">{errors.roadmap}</p>
        )}
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

