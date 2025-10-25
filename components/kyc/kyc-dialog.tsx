'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface KYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type KYCStatus = 'not_started' | 'in_progress' | 'pending' | 'verified' | 'rejected' | null;

export function KYCDialog({ open, onOpenChange }: KYCDialogProps) {
  const { user, kycStatus, refreshKYCStatus } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClient();

  // Refresh KYC status when dialog opens
  React.useEffect(() => {
    if (open && user) {
      refreshKYCStatus();
    }
  }, [open, user, refreshKYCStatus]);

  const syncKYCStatus = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('You must be logged in');
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/kyc/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync status');
      }

      // Refresh the KYC status from auth provider
      await refreshKYCStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync status');
    } finally {
      setIsSyncing(false);
    }
  };

  const startKYCVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('You must be logged in to verify your identity');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/kyc/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize KYC');
      }

      // Open Persona inline or in popup
      if (data.inquiryId && window.Persona) {
        const client = new window.Persona.Client({
          inquiryId: data.inquiryId,
          environment: data.environment || 'sandbox',
          onReady: () => {
            console.log('Persona is ready');
            client.open();
          },
          onComplete: ({ inquiryId }: { inquiryId: string }) => {
            console.log('KYC completed:', inquiryId);
            // Refresh status after completion
            setTimeout(() => {
              refreshKYCStatus();
            }, 2000);
          },
          onCancel: () => {
            console.log('KYC cancelled');
            setIsLoading(false);
          },
          onError: (error: Error) => {
            console.error('Persona error:', error);
            setError('An error occurred during verification');
            setIsLoading(false);
          },
        });
      } else {
        setError('KYC verification service is not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: KYCStatus) => {
    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          title: 'Verified',
          description: 'Your identity has been successfully verified.',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Pending Review',
          description: 'Your verification is being reviewed. This usually takes 1-2 business days.',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
        };
      case 'in_progress':
        return {
          icon: <ShieldCheck className="h-12 w-12 text-blue-500" />,
          title: 'Complete Your Verification',
          description: 'You started verification but haven\'t completed it yet. Click below to continue.',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Verification Failed',
          description: 'We were unable to verify your identity. Please try again or contact support.',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
        };
      default:
        return {
          icon: <ShieldCheck className="h-12 w-12 text-blue-500" />,
          title: 'Start KYC Verification',
          description: 'Verify your identity to unlock additional features and higher trading limits.',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        };
    }
  };

  const statusDisplay = getStatusDisplay(kycStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>KYC Verification</DialogTitle>
          <DialogDescription>
            Know Your Customer (KYC) verification helps us maintain a secure platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Display */}
          <div className={cn('flex flex-col items-center gap-4 rounded-lg p-6', statusDisplay.bgColor)}>
            {statusDisplay.icon}
            <div className="text-center space-y-2">
              <h3 className={cn('text-lg font-semibold', statusDisplay.color)}>
                {statusDisplay.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {statusDisplay.description}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">Error</p>
                <p className="text-sm text-red-500/80">{error}</p>
              </div>
            </div>
          )}

          {/* What you'll need section */}
          {(!kycStatus || kycStatus === 'not_started' || kycStatus === 'rejected' || kycStatus === 'in_progress') && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">What you'll need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>A valid government-issued ID (passport, driver's license, or national ID)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>A device with a camera for selfie verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>5-10 minutes to complete the process</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {kycStatus === 'verified' ? (
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : kycStatus === 'pending' || kycStatus === 'in_progress' ? (
              <>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={syncKYCStatus}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Status'}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={startKYCVerification}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : kycStatus === 'rejected' ? 'Try Again' : kycStatus === 'in_progress' ? 'Continue Verification' : 'Start Verification'}
                </Button>
              </>
            )}
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center">
            Your personal information is encrypted and stored securely. We use Persona for identity verification.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

