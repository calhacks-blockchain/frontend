'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './auth-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

export function LoginDialog() {
  const { currentDialog, closeDialog, openSignup, email, setEmail } = useAuth();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.update(toastId, {
            type: 'error',
            message: 'Invalid credentials',
            description: 'Please check your email and password and try again.',
          });
          return;
        }
        if (error.message.includes('Email not confirmed')) {
          toast.update(toastId, {
            type: 'error',
            message: 'Email not verified',
            description: 'Please check your email and verify your account first.',
          });
          return;
        }
        throw error;
      }

      toast.update(toastId, {
        type: 'success',
        message: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      closeDialog();
    } catch (err) {
      toast.update(toastId, {
        type: 'error',
        message: 'Login failed',
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

  const handleSwitchToSignup = () => {
    closeDialog();
    setTimeout(() => openSignup(), 100);
  };

  const isOpen = currentDialog === 'login';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-[420px] bg-background border-border p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center text-foreground">
            Log In
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5 mt-2">
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

          <div className="flex justify-end">
            <a href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                Or Log In
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
            onClick={handleSwitchToSignup}
            className="text-muted-foreground hover:text-foreground"
          >
            Don&apos;t have an account?{' '}
            <span className="text-primary hover:underline">Sign Up</span>
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
      </DialogContent>
    </Dialog>
  );
}

