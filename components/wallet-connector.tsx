"use client"
import { useAppKit, useAppKitAccount, useAppKitState } from "@reown/appkit/react";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface WalletConnectorProps {
  onDisconnect?: () => void
}

export const WalletConnector = ({ onDisconnect }: WalletConnectorProps) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [isConnected, onDisconnect]);

  const handleConnectWallet = () => {
    open();
  };

  const handleMobileWalletClick = () => {
    open({ view: 'Account' });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (networkId: string | undefined) => {
    if (!networkId) return '';
    
    // Solana Mainnet - genesis hash: 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
    if (networkId.includes('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')) return 'Solana Mainnet';
    
    // Solana Devnet - genesis hash: EtWTRABZaYq6iMfeYKouRu166VU2xqa1
    if (networkId.includes('EtWTRABZaYq6iMfeYKouRu166VU2xqa1')) return 'Solana Devnet';
    
    // Solana Testnet - genesis hash: 4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z
    if (networkId.includes('4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z')) return 'Solana Testnet';
    
    // If network is recognized but not matched, just return empty string to hide it
    return '';
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button 
        variant="default" 
        size="sm"
        disabled
        className="text-white bg-blue-600"
      >
        Loading...
      </Button>
    );
  }

  // Show connect button/icon if not connected
  if (!isConnected || !address) {
    return (
      <div className="flex items-center">
        {/* Mobile - Wallet SVG only */}
        <button 
          onClick={handleConnectWallet}
          className="sm:hidden p-2 rounded-lg transition-colors"
          aria-label="Connect Wallet"
        >
          <svg 
            aria-label="Wallet" 
            className="fill-current text-foreground" 
            fill="currentColor" 
            height="24" 
            viewBox="0 -960 960 960" 
            width="24" 
            xmlns="http://www.w3.org/2000/svg" 
            role="img"
          >
            <path d="M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z"></path>
          </svg>
        </button>
        {/* Desktop - Connect Wallet Button */}
        <Button 
          variant="default" 
          size="sm"
          onClick={handleConnectWallet}
          className="hidden sm:block text-white bg-blue-600 hover:bg-blue-700"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  // Show connected state - Mobile shows only SVG, Desktop shows full info
  return (
    <div className="flex items-center">
      {/* Mobile - Connected Wallet SVG only (clickable for management) */}
      <button 
        onClick={handleMobileWalletClick}
        className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
        aria-label="Manage Wallet"
      >
        <svg 
          aria-label="Connected Wallet" 
          className="fill-current text-green-600" 
          fill="currentColor" 
          height="24" 
          viewBox="0 -960 960 960" 
          width="24" 
          xmlns="http://www.w3.org/2000/svg" 
          role="img"
        >
          <path d="M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z"></path>
        </svg>
        {/* Connected indicator dot */}
      </button>

      {/* Desktop - Full wallet info and AppKit button */}
      <div className="hidden sm:flex items-center space-x-3">
        {/* Custom wallet info display */}
        
        
        {/* AppKit's built-in button for account management */}
        <w3m-button size="sm" />
      </div>
    </div>
  );
};
