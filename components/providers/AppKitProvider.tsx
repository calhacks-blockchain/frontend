"use client"
import { useEffect, useState } from 'react'
import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana, solanaDevnet } from "@reown/appkit/networks";

interface AppKitProviderProps {
  children: React.ReactNode
}

// Create AppKit instance outside of component to ensure it's only created once
let appKitInitialized = false;

export const AppKitProvider: React.FC<AppKitProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize AppKit on client side only
    if (typeof window !== 'undefined' && !appKitInitialized) {
      // Get projectId from environment
      const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

      if (!projectId) {
        console.error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined in environment variables');
        throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is required');
      }

      // Create a metadata object
      const metadata = {
        name: "Peterpan",
        description: "Token-to-equity startup fundraising platform",
        url: process.env.NEXT_PUBLIC_BASE_URL || "https://peterpan.pro",
        icons: ["/logo.png"],
      };

      // Set up Solana Adapter
      const solanaWeb3JsAdapter = new SolanaAdapter();

      // Create AppKit instance - this registers it globally
      createAppKit({
        projectId,
        adapters: [solanaWeb3JsAdapter],
        networks: [solana, solanaDevnet],
        metadata: metadata,
        features: {
          analytics: true,
          email: false,
          socials: false,
          emailShowWallets: true,
          onramp: false,
        },
        themeMode: 'dark',
        themeVariables: {
          '--w3m-z-index': 1000
        }
      });

      appKitInitialized = true;
      setMounted(true)
    }
  }, [])

  // Don't render children until AppKit is initialized
  if (!mounted) {
    return <div></div>
  }

  // Just return the children - AppKit hooks will work because createAppKit registered it globally
  return <>{children}</>
}
