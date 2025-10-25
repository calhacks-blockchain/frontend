'use client';

import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { StepIndicator } from './step-indicator';
import { BasicInfoStep } from './steps/basic-info-step';
import { PitchStep } from './steps/pitch-step';
import { TeamStep } from './steps/team-step';
import { TractionRoadmapStep } from './steps/traction-roadmap-step';
import { TokenomicsStep } from './steps/tokenomics-step';
import { SocialMediaStep } from './steps/social-media-step';
import { ReviewDeployStep } from './steps/review-deploy-step';

const steps = [
  { number: 1, title: 'Basic Info', description: 'Name & Logo' },
  { number: 2, title: 'The Pitch', description: 'Problem & Solution' },
  { number: 3, title: 'Team', description: 'Your People' },
  { number: 4, title: 'Roadmap', description: 'Milestones' },
  { number: 5, title: 'Tokenomics', description: 'Distribution' },
  { number: 6, title: 'Social', description: 'Links & Media' },
  { number: 7, title: 'Deploy', description: 'Review & Launch' },
];

export function CreateWizard() {
  const currentStep = useCreateCoinStore((state) => state.currentStep);
  const setCurrentStep = useCreateCoinStore((state) => state.setCurrentStep);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow going back to previous steps
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step Content */}
      <div className="bg-background">
        {currentStep === 1 && <BasicInfoStep onNext={handleNext} />}
        {currentStep === 2 && <PitchStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <TeamStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 4 && (
          <TractionRoadmapStep onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 5 && <TokenomicsStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 6 && <SocialMediaStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 7 && <ReviewDeployStep onBack={handleBack} />}
      </div>
    </div>
  );
}

