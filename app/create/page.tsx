'use client';

import { useRouter } from 'next/navigation';
import { Navbar04 } from '@/components/ui/shadcn-io/navbar-04';
import { CreateWizard } from '@/components/create-coin/create-wizard';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ToastProvider } from '@/components/ui/toast';
import { useEffect } from 'react';

function CreateCoinPage() {
  const router = useRouter();
  const { openLogin, openSignup, user, logout } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      // Show login prompt
      openLogin();
      // Optionally redirect after a delay
      const timer = setTimeout(() => {
        router.push('/');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, router, openLogin]);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar04 
        user={user}
        onSignInClick={openLogin}
        onSignUpClick={openSignup}
        onLogoutClick={logout}
        onCreateCoinClick={() => router.push('/create')}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-screen-xl">
        {user ? (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3">Create Your Coin</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Launch your startup token in minutes. Fill out the form below to create your coin and start raising funds.
              </p>
            </div>

            {/* Wizard */}
            <CreateWizard />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground max-w-md">
                You need to be signed in to create a coin. Please log in or sign up to continue.
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={openSignup}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Sign Up
                </button>
                <button
                  onClick={openLogin}
                  className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <SignUpDialog />
      <LoginDialog />
    </div>
  );
}

export default function CreatePageWrapper() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CreateCoinPage />
      </AuthProvider>
    </ToastProvider>
  );
}

