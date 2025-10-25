'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '../form-fields/image-upload';
import { teamSchema } from '@/lib/create-coin/validation';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { TeamMember } from '@/types/startup';

interface TeamStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function TeamStep({ onNext, onBack }: TeamStepProps) {
  const { team, setTeam } = useCreateCoinStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teamMembers, setTeamMembers] = useState<Partial<TeamMember>[]>(
    team.team && team.team.length > 0 ? team.team : [{}]
  );

  const handleAddMember = () => {
    if (teamMembers.length < 10) {
      setTeamMembers([...teamMembers, {}]);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (teamMembers.length > 1) {
      const newMembers = teamMembers.filter((_, i) => i !== index);
      setTeamMembers(newMembers);
    }
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setTeamMembers(newMembers);
    
    // Clear errors for this member
    if (errors[`team.${index}.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`team.${index}.${field}`];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update store
    setTeam({ team: teamMembers as TeamMember[] });
    
    // Validate
    const result = teamSchema.safeParse({ team: teamMembers });
    
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
        <h2 className="text-2xl font-bold mb-2">Team</h2>
        <p className="text-muted-foreground">
          Introduce your team. Investors invest in people as much as ideas.
        </p>
      </div>

      <div className="space-y-6">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="p-5 bg-card border border-border rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Team Member {index + 1}
                {index === 0 && (
                  <span className="text-xs text-muted-foreground ml-2">(Founder)</span>
                )}
              </h3>
              {teamMembers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., Sarah Chen"
                  value={member.name || ''}
                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                  className={errors[`team.${index}.name`] ? 'border-destructive' : ''}
                />
                {errors[`team.${index}.name`] && (
                  <p className="text-xs text-destructive">{errors[`team.${index}.name`]}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Role <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., CEO & Co-Founder"
                  value={member.role || ''}
                  onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                  className={errors[`team.${index}.role`] ? 'border-destructive' : ''}
                />
                {errors[`team.${index}.role`] && (
                  <p className="text-xs text-destructive">{errors[`team.${index}.role`]}</p>
                )}
              </div>
            </div>

            {/* Photo */}
            <ImageUpload
              label="Photo"
              description="Professional headshot"
              value={member.photo}
              onChange={(value) => handleMemberChange(index, 'photo', value)}
              required
              aspectRatio="square"
              error={errors[`team.${index}.photo`]}
            />

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Profile (Optional)</label>
              <Input
                placeholder="https://linkedin.com/in/..."
                value={member.linkedin || ''}
                onChange={(e) => handleMemberChange(index, 'linkedin', e.target.value)}
                className={errors[`team.${index}.linkedin`] ? 'border-destructive' : ''}
              />
              {errors[`team.${index}.linkedin`] && (
                <p className="text-xs text-destructive">{errors[`team.${index}.linkedin`]}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio (Optional)</label>
              <textarea
                placeholder="Brief background and experience..."
                value={member.bio || ''}
                onChange={(e) => handleMemberChange(index, 'bio', e.target.value)}
                rows={2}
                maxLength={200}
                className={`w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors[`team.${index}.bio`] ? 'border-destructive' : 'border-input'
                }`}
              />
              <p className="text-xs text-muted-foreground">
                {member.bio?.length || 0}/200 characters
              </p>
              {errors[`team.${index}.bio`] && (
                <p className="text-xs text-destructive">{errors[`team.${index}.bio`]}</p>
              )}
            </div>
          </div>
        ))}

        {/* Add Member Button */}
        {teamMembers.length < 10 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddMember}
            className="w-full gap-2"
          >
            <Plus size={16} />
            Add Team Member
          </Button>
        )}

        {errors.team && (
          <p className="text-xs text-destructive">{errors.team}</p>
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

