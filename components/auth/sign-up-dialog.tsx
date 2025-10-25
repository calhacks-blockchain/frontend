'use client';

import * as React from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './auth-provider';
import { OtpInput } from './otp-input';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

export function SignUpDialog() {
  const {
    currentDialog,
    signupStep,
    email,
    code,
    password,
    confirmPassword,
    inviteCode,
    closeDialog,
    setSignupStep,
    setEmail,
    setCode,
    setPassword,
    setConfirmPassword,
    setInviteCode,
    openLogin,
  } = useAuth();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(58);
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();
  const toast = useToast();

  // Resend timer countdown
  React.useEffect(() => {
    if (signupStep === 2 && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [signupStep, resendTimer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const toastId = toast.loading('Sending verification code...');

    try {
      // Use signInWithOtp to send OTP code via email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            invite_code: inviteCode || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.update(toastId, {
            type: 'error',
            message: 'This email is already registered',
            description: 'Please log in or use a different email address.',
          });
          return;
        }
        if (error.message.includes('you can only request this after')) {
          const seconds = error.message.match(/after (\d+) seconds/)?.[1] || '60';
          toast.update(toastId, {
            type: 'error',
            message: 'Too many requests',
            description: `Please wait ${seconds} seconds before requesting another code.`,
          });
          return;
        }
        throw error;
      }

      toast.update(toastId, {
        type: 'success',
        message: 'Verification code sent!',
        description: 'Check your email for the verification code.',
      });
      setSignupStep(2);
      setResendTimer(58);
    } catch (err) {
      toast.update(toastId, {
        type: 'error',
        message: 'Failed to send verification code',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsLoading(true);
    const toastId = toast.loading('Verifying code...');

    try {
      // Verify OTP - this will automatically sign the user in
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) throw error;

      toast.update(toastId, {
        type: 'success',
        message: 'Email verified!',
        description: 'Now set your password to complete signup.',
      });
      setSignupStep(3);
    } catch (err) {
      toast.update(toastId, {
        type: 'error',
        message: 'Invalid verification code',
        description: err instanceof Error ? err.message : 'Please check your code and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    const toastId = toast.loading('Resending verification code...');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            invite_code: inviteCode || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('you can only request this after')) {
          const seconds = error.message.match(/after (\d+) seconds/)?.[1] || '60';
          toast.update(toastId, {
            type: 'error',
            message: 'Too many requests',
            description: `Please wait ${seconds} seconds before requesting another code.`,
          });
          return;
        }
        throw error;
      }

      toast.update(toastId, {
        type: 'success',
        message: 'Verification code resent!',
        description: 'Check your email for the new code.',
      });
      setResendTimer(58);
      setCode('');
    } catch (err) {
      toast.update(toastId, {
        type: 'error',
        message: 'Failed to resend code',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both passwords are the same.',
      });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating account...');

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.update(toastId, {
        type: 'success',
        message: 'Account created successfully!',
        description: 'Welcome to peterpan.pro',
      });
      closeDialog();
    } catch (err) {
      toast.update(toastId, {
        type: 'error',
        message: 'Failed to set password',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      toast.error('Failed to sign in with Google', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleWalletConnect = () => {
    open();
  };

  const handleBackToLogin = () => {
    closeDialog();
    setTimeout(() => openLogin(), 100);
  };

  const handleBack = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1);
    }
  };

  const isOpen = currentDialog === 'signup';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-[420px] bg-background border-border p-6">
        {/* Step 1: Email & Invite Code */}
        {signupStep === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center text-foreground">
                Sign Up
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEmailSubmit} className="space-y-2.5 mt-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-input border-border text-foreground text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Invite code (optional)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-10 bg-input border-border text-foreground text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Sign Up'}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">
                    Or Sign Up
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 bg-muted text-foreground hover:bg-accent font-medium text-sm"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 bg-muted text-foreground hover:bg-accent font-medium text-sm"
                  onClick={handleWalletConnect}
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 108 93">
                    <path
                      d="M0.5 78.1789C0.5 90.2265 6.7065 93 13.1613 93C26.8155 93 37.077 80.6058 43.2007 70.8118C42.4559 72.9786 42.0422 75.1454 42.0422 77.2255C42.0422 82.946 45.1868 87.0196 51.3933 87.0196C59.9169 87.0196 69.0197 79.219 73.7367 70.8118C73.4056 72.0252 73.2401 73.1519 73.2401 74.192C73.2401 78.1789 75.3917 80.6924 79.7777 80.6924C93.5975 80.6924 107.5 55.124 107.5 32.7623C107.5 15.3411 99.0592 0 77.8743 0C40.6354 0 0.5 47.4967 0.5 78.1789ZM65.0476 30.8555C65.0476 26.5219 67.3647 23.4884 70.7575 23.4884C74.0677 23.4884 76.3848 26.5219 76.3848 30.8555C76.3848 35.1892 74.0677 38.3094 70.7575 38.3094C67.3647 38.3094 65.0476 35.1892 65.0476 30.8555ZM82.7568 30.8555C82.7568 26.5219 85.0739 23.4884 88.4668 23.4884C91.7769 23.4884 94.094 26.5219 94.094 30.8555C94.094 35.1892 91.7769 38.3094 88.4668 38.3094C85.0739 38.3094 82.7568 35.1892 82.7568 30.8555Z"
                      fill="#AB9FF2"
                    />
                  </svg>
                  Connect Wallet
                </Button>
              </div>
            </form>

            <div className="mt-3 text-center text-xs">
              <button
                onClick={handleBackToLogin}
                className="text-muted-foreground hover:text-foreground"
              >
                Already have an account?{' '}
                <span className="text-primary hover:underline">Login</span>
              </button>
            </div>

            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              By creating an account, you agree to peterpan.pro&apos;s{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>
            </div>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {signupStep === 2 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 h-8 w-8"
              onClick={handleBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center text-foreground">
                Confirmation Code
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCodeSubmit} className="space-y-4 mt-2">
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ve sent a verification code to
                <br />
                <span className="text-foreground">{email}</span>
              </p>

              <OtpInput value={code} onChange={setCode} length={6} />

              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {resendTimer > 0 ? (
                  <>
                    You can resend a new code in{' '}
                    <span className="text-foreground font-medium">{resendTimer}</span> seconds
                  </>
                ) : (
                  <>
                    Didn&apos;t receive a code?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-primary hover:underline font-medium"
                      disabled={isLoading}
                    >
                      Resend
                    </button>
                  </>
                )}
              </p>
            </form>

            <div className="mt-3 text-center text-[10px] text-muted-foreground">
              By creating an account, you agree to peterpan.pro&apos;s{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>
            </div>
          </>
        )}

        {/* Step 3: Create Password */}
        {signupStep === 3 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 h-8 w-8"
              onClick={handleBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center text-foreground">
                Create password
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 bg-input border-border text-foreground text-sm pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Confirm password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 bg-input border-border text-foreground text-sm pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm mt-2"
                disabled={isLoading || !password || password !== confirmPassword}
              >
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Button>
            </form>

            <div className="mt-3 text-center text-[10px] text-muted-foreground">
              By creating an account, you agree to peterpan.pro&apos;s{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

