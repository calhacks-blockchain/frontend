'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '../form-fields/image-upload';
import { socialMediaSchema } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft, Globe, Twitter, MessageCircle, Send, Plus, Trash2 } from 'lucide-react';
import type { SocialMediaData } from '@/lib/create-coin/validation';

interface SocialMediaStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SocialMediaStep({ onNext, onBack }: SocialMediaStepProps) {
  const { socialMedia, setSocialMedia } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<SocialMediaData>>({
    website: socialMedia.website || '',
    twitter: socialMedia.twitter || '',
    discord: socialMedia.discord || '',
    telegram: socialMedia.telegram || '',
    sliderImages: socialMedia.sliderImages || ['', '', ''],
    tweetIds: socialMedia.tweetIds || [],
  });

  const [tweetIds, setTweetIds] = useState<string[]>(socialMedia.tweetIds || []);

  const handleChange = (field: keyof SocialMediaData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSliderImageChange = (index: number, value: string) => {
    const newImages = [...(formData.sliderImages || ['', '', ''])];
    newImages[index] = value;
    handleChange('sliderImages', newImages);
  };

  const handleAddTweetId = () => {
    setTweetIds([...tweetIds, '']);
  };

  const handleRemoveTweetId = (index: number) => {
    const newTweetIds = tweetIds.filter((_, i) => i !== index);
    setTweetIds(newTweetIds);
  };

  const handleTweetIdChange = (index: number, value: string) => {
    const newTweetIds = [...tweetIds];
    newTweetIds[index] = value;
    setTweetIds(newTweetIds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty tweet IDs
    const validTweetIds = tweetIds.filter(id => id.trim() !== '');
    
    const dataToValidate = {
      ...formData,
      tweetIds: validTweetIds,
    };
    
    // Update store
    setSocialMedia(dataToValidate);
    
    // Validate
    const result = socialMediaSchema.safeParse(dataToValidate);
    
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
        <h2 className="text-2xl font-bold mb-2">Social & Media</h2>
        <p className="text-muted-foreground">
          Add your social links and showcase images to build credibility and engagement.
        </p>
      </div>

      {/* Social Links */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-4">
        <h3 className="font-semibold">Social Links</h3>
        
        <div className="space-y-4">
          {/* Website */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" />
              Website
            </label>
            <Input
              placeholder="https://yourcompany.com"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className={errors.website ? 'border-destructive' : ''}
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website}</p>
            )}
          </div>

          {/* Twitter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Twitter size={16} className="text-muted-foreground" />
              Twitter/X
            </label>
            <Input
              placeholder="https://twitter.com/yourcompany"
              value={formData.twitter || ''}
              onChange={(e) => handleChange('twitter', e.target.value)}
              className={errors.twitter ? 'border-destructive' : ''}
            />
            {errors.twitter && (
              <p className="text-xs text-destructive">{errors.twitter}</p>
            )}
          </div>

          {/* Discord */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle size={16} className="text-muted-foreground" />
              Discord
            </label>
            <Input
              placeholder="https://discord.gg/yourserver"
              value={formData.discord || ''}
              onChange={(e) => handleChange('discord', e.target.value)}
              className={errors.discord ? 'border-destructive' : ''}
            />
            {errors.discord && (
              <p className="text-xs text-destructive">{errors.discord}</p>
            )}
          </div>

          {/* Telegram */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Send size={16} className="text-muted-foreground" />
              Telegram
            </label>
            <Input
              placeholder="https://t.me/yourgroup"
              value={formData.telegram || ''}
              onChange={(e) => handleChange('telegram', e.target.value)}
              className={errors.telegram ? 'border-destructive' : ''}
            />
            {errors.telegram && (
              <p className="text-xs text-destructive">{errors.telegram}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Showcase Slider */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">
            Company Showcase Images <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            3 images that showcase your product, team, or achievements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => (
            <ImageUpload
              key={index}
              label={`Image ${index + 1}`}
              value={formData.sliderImages?.[index] || ''}
              onChange={(value) => handleSliderImageChange(index, value)}
              required
              aspectRatio="wide"
              error={errors[`sliderImages.${index}`]}
            />
          ))}
        </div>

        {errors.sliderImages && (
          <p className="text-xs text-destructive">{errors.sliderImages}</p>
        )}
      </div>

      {/* Tweet IDs (Optional) */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Featured Tweets (Optional)</h3>
          <p className="text-xs text-muted-foreground">
            Add tweet IDs to display real tweets from X/Twitter on your profile
          </p>
        </div>

        {tweetIds.map((tweetId, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Tweet ID (e.g., 1882530223897534599)"
              value={tweetId}
              onChange={(e) => handleTweetIdChange(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveTweetId(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddTweetId}
          className="w-full gap-2"
        >
          <Plus size={16} />
          Add Tweet ID
        </Button>

        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">How to find a Tweet ID:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open the tweet on Twitter/X</li>
            <li>Look at the URL: twitter.com/username/status/<strong>TWEET_ID</strong></li>
            <li>Copy the numbers after "status/"</li>
          </ol>
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

