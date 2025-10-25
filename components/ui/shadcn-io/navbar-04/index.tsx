'use client';

import * as React from 'react';
import { useEffect, useState, useRef, useId } from 'react';
import { SearchIcon, Settings, ChevronDown, Zap, UserRoundCog, LogOut, Shield, Languages, Sparkles, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { generateMockTokens } from '@/lib/mock-tokens';
import type { TokenData } from '@/components/token-card';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { WalletConnector } from '@/components/wallet-connector';

// Logo component for the navbar
const Logo = () => {
  return (
    <Image 
      src="/logo.png" 
      alt="Logo" 
      width={24} 
      height={24}
      className="object-contain"
    />
  );
};

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
);

// Chain/Network icons
const ChainIcon = ({ name, className }: { name: string; className?: string }) => {
  const iconMap: Record<string, string> = {
    BTC: '/bitcoin-btc-logo.svg',
    ETH: '/ethereum-eth-logo.svg',
    SOL: '/solana-sol-logo.svg',
  };
  
  const iconSrc = iconMap[name] || iconMap.SOL;
  
  return (
    <Image 
      src={iconSrc}
      alt={`${name} icon`}
      width={18}
      height={18}
      className={cn('rounded-full w-[18px] h-[18px] object-contain', className)}
    />
  );
};

// Types
export interface Navbar04NavItem {
  href?: string;
  label: string;
}

export interface Chain {
  name: string;
  label: string;
}

export interface Navbar04Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar04NavItem[];
  signInText?: string;
  signUpText?: string;
  searchPlaceholder?: string;
  chains?: Chain[];
  selectedChain?: string;
  user?: SupabaseUser | null;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onChainChange?: (chain: string) => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  onCreateCoinClick?: () => void;
}

// Default navigation links
const defaultNavigationLinks: Navbar04NavItem[] = [
  { href: '#', label: 'Trenches' },
  { href: '#', label: 'Trending' },
  { href: '#', label: 'Discover' },
  { href: '#', label: 'Monitor' },
  { href: '#', label: 'Track' },
  { href: '#', label: 'Portfolio' },
  { href: '#', label: 'Rewards' },
];

// Default chains
const defaultChains: Chain[] = [
  { name: 'SOL', label: 'SOL' },
  { name: 'ETH', label: 'ETH' },
  { name: 'BTC', label: 'BTC' },
];

export const Navbar04 = React.forwardRef<HTMLElement, Navbar04Props>(
  (
    {
      className,
      logo = <Logo />,
      logoHref = '#',
      navigationLinks = defaultNavigationLinks,
      signInText = 'Log In',
      signUpText = 'Sign Up',
      searchPlaceholder = 'Search name, CA, wallet...',
      chains = defaultChains,
      selectedChain = 'SOL',
      user,
      onSignInClick,
      onSignUpClick,
      onSearchSubmit,
      onChainChange,
      onSettingsClick,
      onLogoutClick,
      onCreateCoinClick,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const [currentChain, setCurrentChain] = useState(selectedChain);
    const [open, setOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<TokenData[]>([]);
    const containerRef = useRef<HTMLElement>(null);
    const searchId = useId();

    // Initialize search results with mock tokens
    useEffect(() => {
      setSearchResults(generateMockTokens(20));
    }, []);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const handleSearchSubmit = (query: string) => {
      if (onSearchSubmit) {
        onSearchSubmit(query);
      }
      setOpen(false);
    };

    const handleTokenSelect = (token: TokenData) => {
      console.log('Selected token:', token);
      // You can add custom handler here
      setOpen(false);
    };

    const handleChainChange = (chain: string) => {
      setCurrentChain(chain);
      if (onChainChange) {
        onChainChange(chain);
      }
    };

    return (
      <header
        ref={combinedRef}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline',
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-2">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-8 w-8 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-0">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <button
                            onClick={(e) => e.preventDefault()}
                            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                          >
                            {link.label}
                          </button>
                        </NavigationMenuItem>
                      ))}
                      <NavigationMenuItem
                        className="w-full"
                        role="presentation"
                        aria-hidden={true}
                      >
                        <div
                          role="separator"
                          aria-orientation="horizontal"
                          className="bg-border -mx-1 my-1 h-px"
                        />
                      </NavigationMenuItem>
                      {user ? (
                        <>
                          <NavigationMenuItem className="w-full">
                            <Button
                              size="sm"
                              className="w-full text-left text-sm gap-1.5 justify-start"
                              onClick={(e) => {
                                e.preventDefault();
                                if (onCreateCoinClick) onCreateCoinClick();
                              }}
                            >
                              <Plus size={16} />
                              Create Coin
                            </Button>
                          </NavigationMenuItem>
                          <NavigationMenuItem
                            className="w-full"
                            role="presentation"
                            aria-hidden={true}
                          >
                            <div
                              role="separator"
                              aria-orientation="horizontal"
                              className="bg-border -mx-1 my-1 h-px"
                            />
                          </NavigationMenuItem>
                          <NavigationMenuItem className="w-full">
                            <button
                              onClick={() => console.log('Account settings')}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              <Shield size={16} className="text-muted-foreground" />
                              <span>Account and Security</span>
                            </button>
                          </NavigationMenuItem>
                          <NavigationMenuItem className="w-full">
                            <button
                              onClick={() => console.log('Translation settings')}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              <Languages size={16} className="text-muted-foreground" />
                              <span>Translation settings</span>
                            </button>
                          </NavigationMenuItem>
                          <NavigationMenuItem className="w-full">
                            <button
                              onClick={() => console.log('Feature updates')}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              <Sparkles size={16} className="text-muted-foreground" />
                              <span>Feature Updates</span>
                            </button>
                          </NavigationMenuItem>
                          <NavigationMenuItem
                            className="w-full"
                            role="presentation"
                            aria-hidden={true}
                          >
                            <div
                              role="separator"
                              aria-orientation="horizontal"
                              className="bg-border -mx-1 my-1 h-px"
                            />
                          </NavigationMenuItem>
                          <NavigationMenuItem className="w-full">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (onLogoutClick) onLogoutClick();
                              }}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent cursor-pointer no-underline text-red-500"
                            >
                              <LogOut size={16} />
                              <span>Log Out</span>
                            </button>
                          </NavigationMenuItem>
                        </>
                      ) : (
                        <>
                          <NavigationMenuItem className="w-full">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (onSignUpClick) onSignUpClick();
                              }}
                              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              {signUpText}
                            </button>
                          </NavigationMenuItem>
                          <NavigationMenuItem className="w-full">
                            <Button
                              size="sm"
                              className="mt-0.5 w-full text-left text-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                if (onSignInClick) onSignInClick();
                              }}
                            >
                              {signInText}
                            </Button>
                          </NavigationMenuItem>
                        </>
                      )}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            
            {/* Logo and Brand */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6">
                {logo}
              </div>
              <span className="hidden font-bold text-base sm:inline-block">peterpan.pro</span>
            </Link>
            
            {/* Navigation menu - Desktop only */}
            {!isMobile && (
              <NavigationMenu className="flex">
                <NavigationMenuList className="gap-0">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuLink
                        href={link.href}
                        onClick={(e) => e.preventDefault()}
                        className="text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group inline-flex h-8 w-max items-center justify-center rounded-md bg-background px-3 text-sm focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
          
          {/* Right side - Search, Chain Selector, Settings, Auth */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {/* Search button */}
              <Button
                variant="outline"
                className="h-8 w-56 justify-start bg-muted/50 text-sm font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setOpen(true)}
              >
                <SearchIcon size={14} className="mr-2" />
                <span>{searchPlaceholder}</span>
              </Button>

              {/* Command Dialog for Search */}
              <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Results">
                    {searchResults.map((token) => (
                      <CommandItem
                        key={token.id}
                        value={`${token.name} ${token.ticker}`}
                        onSelect={() => handleTokenSelect(token)}
                        className="flex items-center justify-between gap-4 py-4 px-3"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Token Image */}
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={token.image}
                              alt={token.name}
                              width={64}
                              height={64}
                              className="rounded-lg w-16 h-16 object-cover"
                              unoptimized
                            />
                          </div>
                          
                          {/* Token Info */}
                          <div className="flex flex-col min-w-0 gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base truncate">
                                {token.ticker}
                              </span>
                              <span className="text-sm text-muted-foreground truncate">
                                {token.name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {token.timeAgo}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">MC</div>
                            <div className="text-base font-semibold">${token.marketCap}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">V</div>
                            <div className="text-base font-semibold">${token.volume}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">L</div>
                            <div className="text-base font-semibold">${token.liquidity}</div>
                          </div>
                          
                          {/* Action Button */}
                          <Button
                            size="icon"
                            variant="default"
                            className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Quick action for', token.ticker);
                            }}
                          >
                            <Zap size={16} />
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </CommandDialog>
              
              {/* Chain Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-0.5 bg-muted/50 min-w-0 cursor-pointer"
                  >
                    <ChainIcon name={currentChain} />
                    <span className="font-medium text-xs">{currentChain}</span>
                    <ChevronDown size={10} className="text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-40 p-2">
                  <div className="flex flex-col gap-0.5">
                    {chains.map((chain) => (
                      <button
                        key={chain.name}
                        onClick={() => handleChainChange(chain.name)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          currentChain === chain.name && 'bg-accent'
                        )}
                      >
                        <ChainIcon name={chain.name} />
                        <span>{chain.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Wallet Connector */}
              <WalletConnector />
              
              {/* Authenticated User Menu */}
              {user ? (
                <>
                  {/* Create Coin Button */}
                  <Button
                    size="sm"
                    className="h-8 px-3 font-medium text-xs gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onCreateCoinClick) onCreateCoinClick();
                    }}
                  >
                    <Plus size={14} />
                    Create Coin
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center cursor-pointer"
                      >
                        <UserRoundCog size={16} className="text-foreground" />
                      </Button>
                    </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => console.log('Account settings')}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                      >
                        <Shield size={16} className="text-muted-foreground" />
                        <span>Account and Security</span>
                      </button>
                      <button
                        onClick={() => console.log('Translation settings')}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                      >
                        <Languages size={16} className="text-muted-foreground" />
                        <span>Translation settings</span>
                      </button>
                      <button
                        onClick={() => console.log('Feature updates')}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                      >
                        <Sparkles size={16} className="text-muted-foreground" />
                        <span>Feature Updates</span>
                      </button>
                      <div
                        role="separator"
                        aria-orientation="horizontal"
                        className="bg-border -mx-1 my-1 h-px"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (onLogoutClick) onLogoutClick();
                        }}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent cursor-pointer text-left text-red-500 hover:text-red-500"
                      >
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                </>
              ) : (
                <>
                  {/* Sign Up Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 font-medium text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSignUpClick) onSignUpClick();
                    }}
                  >
                    {signUpText}
                  </Button>
                  
                  {/* Log In Button */}
                  <Button
                    size="sm"
                    className="h-8 px-3 font-medium text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSignInClick) onSignInClick();
                    }}
                  >
                    {signInText}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);

Navbar04.displayName = 'Navbar04';

export { Logo, HamburgerIcon, ChainIcon };