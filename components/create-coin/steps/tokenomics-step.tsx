'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tokenomicsSchema } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { TokenDistribution, UseOfFunds } from '@/types/startup';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-utils';

interface TokenomicsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const colorOptions = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#14b8a6', '#06b6d4', '#6366f1', '#f97316', '#ec4899',
];

export function TokenomicsStep({ onNext, onBack }: TokenomicsStepProps) {
  const { tokenomics, setTokenomics } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [goal, setGoal] = useState(tokenomics.goal || 100000);
  const [equityOffered, setEquityOffered] = useState(tokenomics.equityOffered || 10);
  const [founderAllocation, setFounderAllocation] = useState(tokenomics.founderAllocation || 20);
  
  const [tokenDistribution, setTokenDistribution] = useState<TokenDistribution[]>(
    tokenomics.tokenDistribution || [
      { category: 'Public Sale', percentage: 40, color: '#10b981' },
      { category: 'Founders', percentage: 20, color: '#3b82f6' },
      { category: 'Team', percentage: 15, color: '#8b5cf6' },
      { category: 'Advisors', percentage: 5, color: '#f59e0b' },
      { category: 'Future Rounds', percentage: 20, color: '#6b7280' },
    ]
  );

  const [useOfFunds, setUseOfFunds] = useState<UseOfFunds[]>(
    tokenomics.useOfFunds || [
      { category: 'Engineering', percentage: 40, amount: 0 },
      { category: 'Sales & Marketing', percentage: 30, amount: 0 },
      { category: 'Operations', percentage: 20, amount: 0 },
      { category: 'Legal & Compliance', percentage: 10, amount: 0 },
    ]
  );

  // Auto-calculate amounts when goal changes
  useEffect(() => {
    const newUseOfFunds = useOfFunds.map(item => ({
      ...item,
      amount: (goal * item.percentage) / 100,
    }));
    setUseOfFunds(newUseOfFunds);
  }, [goal]);

  const distributionTotal = tokenDistribution.reduce((sum, item) => sum + item.percentage, 0);
  const fundsTotal = useOfFunds.reduce((sum, item) => sum + item.percentage, 0);

  const handleDistributionChange = (
    index: number,
    field: keyof TokenDistribution,
    value: string | number
  ) => {
    const newDistribution = [...tokenDistribution];
    newDistribution[index] = { ...newDistribution[index], [field]: value };
    setTokenDistribution(newDistribution);
  };

  const handleAddDistribution = () => {
    setTokenDistribution([
      ...tokenDistribution,
      { category: '', percentage: 0, color: colorOptions[tokenDistribution.length % colorOptions.length] },
    ]);
  };

  const handleRemoveDistribution = (index: number) => {
    if (tokenDistribution.length > 2) {
      setTokenDistribution(tokenDistribution.filter((_, i) => i !== index));
    }
  };

  const handleFundsChange = (index: number, field: keyof UseOfFunds, value: string | number) => {
    const newFunds = [...useOfFunds];
    if (field === 'percentage') {
      const percentage = typeof value === 'string' ? parseFloat(value) : value;
      newFunds[index] = {
        ...newFunds[index],
        percentage,
        amount: (goal * percentage) / 100,
      };
    } else {
      newFunds[index] = { ...newFunds[index], [field]: value };
    }
    setUseOfFunds(newFunds);
  };

  const handleAddFunds = () => {
    setUseOfFunds([...useOfFunds, { category: '', percentage: 0, amount: 0 }]);
  };

  const handleRemoveFunds = (index: number) => {
    if (useOfFunds.length > 2) {
      setUseOfFunds(useOfFunds.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update store
    setTokenomics({
      goal,
      equityOffered,
      founderAllocation,
      tokenDistribution,
      useOfFunds,
    });
    
    // Validate
    const result = tokenomicsSchema.safeParse({
      goal,
      equityOffered,
      founderAllocation,
      tokenDistribution,
      useOfFunds,
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
        <h2 className="text-2xl font-bold mb-2">Tokenomics</h2>
        <p className="text-muted-foreground">
          Define your fundraising goals and how you'll distribute tokens and allocate funds.
        </p>
      </div>

      {/* Fundraising Goals */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-4">
        <h3 className="font-semibold">Fundraising Goals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Fundraising Goal <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="100000"
              value={goal}
              onChange={(e) => setGoal(parseFloat(e.target.value) || 0)}
              min={1000}
            />
            <p className="text-xs text-muted-foreground">
              Target amount: {formatCurrency(goal, 0)}
            </p>
            {errors.goal && (
              <p className="text-xs text-destructive">{errors.goal}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Equity Offered (%) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="10"
              value={equityOffered}
              onChange={(e) => setEquityOffered(parseFloat(e.target.value) || 0)}
              min={1}
              max={50}
            />
            {errors.equityOffered && (
              <p className="text-xs text-destructive">{errors.equityOffered}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Founder Allocation (%) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="20"
              value={founderAllocation}
              onChange={(e) => setFounderAllocation(parseFloat(e.target.value) || 0)}
              min={10}
              max={50}
            />
            {errors.founderAllocation && (
              <p className="text-xs text-destructive">{errors.founderAllocation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Token Distribution */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Token Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Must total 100% (Current: {distributionTotal.toFixed(1)}%)
            </p>
          </div>
          {Math.abs(distributionTotal - 100) > 0.01 && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle size={16} />
              Not 100%
            </div>
          )}
        </div>

        {tokenDistribution.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-card border border-border rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => handleDistributionChange(index, 'color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-sm font-medium">Category {index + 1}</span>
              </div>
              {tokenDistribution.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDistribution(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Category name"
                value={item.category}
                onChange={(e) => handleDistributionChange(index, 'category', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Percentage"
                value={item.percentage}
                onChange={(e) =>
                  handleDistributionChange(index, 'percentage', parseFloat(e.target.value) || 0)
                }
                min={0}
                max={100}
                step={0.1}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddDistribution}
          className="w-full gap-2"
        >
          <Plus size={16} />
          Add Category
        </Button>

        {errors.tokenDistribution && (
          <p className="text-xs text-destructive">{errors.tokenDistribution}</p>
        )}
      </div>

      {/* Use of Funds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Use of Funds</h3>
            <p className="text-xs text-muted-foreground">
              Must total 100% (Current: {fundsTotal.toFixed(1)}%)
            </p>
          </div>
          {Math.abs(fundsTotal - 100) > 0.01 && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle size={16} />
              Not 100%
            </div>
          )}
        </div>

        {useOfFunds.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-card border border-border rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category {index + 1}</span>
              {useOfFunds.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFunds(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Category name"
                value={item.category}
                onChange={(e) => handleFundsChange(index, 'category', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Percentage"
                value={item.percentage}
                onChange={(e) => handleFundsChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
              />
              <Input
                value={formatCurrency(item.amount, 0)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddFunds}
          className="w-full gap-2"
        >
          <Plus size={16} />
          Add Category
        </Button>

        {errors.useOfFunds && (
          <p className="text-xs text-destructive">{errors.useOfFunds}</p>
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

