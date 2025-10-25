'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '../form-fields/image-upload';
import { basicInfoSchema, type BasicInfoData } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';

interface BasicInfoStepProps {
  onNext: () => void;
}

export function BasicInfoStep({ onNext }: BasicInfoStepProps) {
  const { basicInfo, setBasicInfo } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof BasicInfoData, value: string) => {
    setBasicInfo({ [field]: value });
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
    const result = basicInfoSchema.safeParse(basicInfo);
    
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
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Let's start with the basics. Give your project a name, ticker, and a compelling tagline.
        </p>
      </div>

      <div className="space-y-5">
        {/* Company Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Company Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            placeholder="e.g., Ashby"
            value={basicInfo.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Ticker Symbol */}
        <div className="space-y-2">
          <label htmlFor="ticker" className="text-sm font-medium">
            Ticker Symbol <span className="text-destructive">*</span>
          </label>
          <Input
            id="ticker"
            placeholder="e.g., ASHBY"
            value={basicInfo.ticker || ''}
            onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
            maxLength={10}
            className={errors.ticker ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">
            2-10 characters, will be converted to uppercase
          </p>
          {errors.ticker && (
            <p className="text-xs text-destructive">{errors.ticker}</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <label htmlFor="tagline" className="text-sm font-medium">
            Tagline <span className="text-destructive">*</span>
          </label>
          <Input
            id="tagline"
            placeholder="e.g., Modern recruiting platform for high-growth teams"
            value={basicInfo.tagline || ''}
            onChange={(e) => handleChange('tagline', e.target.value)}
            maxLength={100}
            className={errors.tagline ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">
            A concise one-liner that describes what you do ({basicInfo.tagline?.length || 0}/100)
          </p>
          {errors.tagline && (
            <p className="text-xs text-destructive">{errors.tagline}</p>
          )}
        </div>

        {/* Logo Upload */}
        <ImageUpload
          label="Company Logo"
          description="Square image recommended (e.g., 512x512px)"
          value={basicInfo.logo}
          onChange={(value) => handleChange('logo', value)}
          required
          aspectRatio="square"
          error={errors.logo}
        />

        {/* Cover Image Upload (Optional) */}
        <ImageUpload
          label="Cover Image (Optional)"
          description="Wide banner image for your profile"
          value={basicInfo.coverImage}
          onChange={(value) => handleChange('coverImage', value)}
          aspectRatio="wide"
        />

        {/* Fundraising Parameters */}
        <div className="p-5 bg-card border border-border rounded-lg space-y-4">
          <h3 className="font-semibold">Fundraising Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="totalSupply" className="text-sm font-medium">
                Total Supply <span className="text-destructive">*</span>
              </label>
              <Input
                id="totalSupply"
                placeholder="1000000"
                value={basicInfo.totalSupply || ''}
                onChange={(e) => handleChange('totalSupply', e.target.value)}
                className={errors.totalSupply ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                The total number of tokens that will ever exist
              </p>
              {errors.totalSupply && (
                <p className="text-xs text-destructive">{errors.totalSupply}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="valuation" className="text-sm font-medium">
                Initial Project Valuation (SOL) <span className="text-destructive">*</span>
              </label>
              <Input
                id="valuation"
                placeholder="1000"
                value={basicInfo.valuation || ''}
                onChange={(e) => handleChange('valuation', e.target.value)}
                className={errors.valuation ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Sets the starting price for your token (minimum 1 SOL)
              </p>
              {errors.valuation && (
                <p className="text-xs text-destructive">{errors.valuation}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="percentageForSale" className="text-sm font-medium">
                Percentage of Supply to Sell (%) <span className="text-destructive">*</span>
              </label>
              <Input
                id="percentageForSale"
                placeholder="20"
                value={basicInfo.percentageForSale || ''}
                onChange={(e) => handleChange('percentageForSale', e.target.value)}
                className={errors.percentageForSale ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                The percentage of total supply you want to sell
              </p>
              {errors.percentageForSale && (
                <p className="text-xs text-destructive">{errors.percentageForSale}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="targetRaise" className="text-sm font-medium">
                Fundraising Goal (SOL) <span className="text-destructive">*</span>
              </label>
              <Input
                id="targetRaise"
                placeholder="200"
                value={basicInfo.targetRaise || ''}
                onChange={(e) => handleChange('targetRaise', e.target.value)}
                className={errors.targetRaise ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                The total amount of SOL you aim to collect
              </p>
              {errors.targetRaise && (
                <p className="text-xs text-destructive">{errors.targetRaise}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
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

