'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type DialogType = 'login' | 'signup' | null;

interface AuthContextValue {
  currentDialog: DialogType;
  signupStep: number;
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
  user: User | null;
  isLoading: boolean;
  kycStatus: string | null;
  openLogin: () => void;
  openSignup: () => void;
  closeDialog: () => void;
  setSignupStep: (step: number) => void;
  setEmail: (email: string) => void;
  setCode: (code: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setInviteCode: (code: string) => void;
  resetForm: () => void;
  logout: () => Promise<void>;
  refreshKYCStatus: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentDialog, setCurrentDialog] = React.useState<DialogType>(null);
  const [signupStep, setSignupStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [kycStatus, setKycStatus] = React.useState<string | null>(null);
  const supabase = createClient();

  // Listen to auth state changes
  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const openLogin = React.useCallback(() => {
    setCurrentDialog('login');
  }, []);

  const openSignup = React.useCallback(() => {
    setCurrentDialog('signup');
    setSignupStep(1);
  }, []);

  const closeDialog = React.useCallback(() => {
    setCurrentDialog(null);
    // Reset form after a short delay to avoid UI glitches
    setTimeout(() => {
      setSignupStep(1);
      setEmail('');
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setInviteCode('');
    }, 300);
  }, []);

  const resetForm = React.useCallback(() => {
    setSignupStep(1);
    setEmail('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
  }, []);

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const refreshKYCStatus = React.useCallback(async () => {
    if (!user) {
      setKycStatus(null);
      return;
    }
    try {
      const response = await fetch('/api/kyc/status');
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.status || null);
      } else {
        // Handle non-OK HTTP responses by clearing stale status
        console.error('Failed to fetch KYC status:', {
          status: response.status,
          statusText: response.statusText,
        });
        setKycStatus(null);
      }
    } catch (error) {
      // Handle network/runtime errors
      console.error('Failed to fetch KYC status (network/runtime error):', error);
      setKycStatus(null);
    }
  }, [user]);

  const value = React.useMemo(
    () => ({
      currentDialog,
      signupStep,
      email,
      code,
      password,
      confirmPassword,
      inviteCode,
      user,
      isLoading,
      kycStatus,
      openLogin,
      openSignup,
      closeDialog,
      setSignupStep,
      setEmail,
      setCode,
      setPassword,
      setConfirmPassword,
      setInviteCode,
      resetForm,
      logout,
      refreshKYCStatus,
    }),
    [
      currentDialog,
      signupStep,
      email,
      code,
      password,
      confirmPassword,
      inviteCode,
      user,
      isLoading,
      kycStatus,
      openLogin,
      openSignup,
      closeDialog,
      resetForm,
      logout,
      refreshKYCStatus,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

