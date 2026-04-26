"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useWalletClient, useDisconnect } from 'wagmi';
import { initSocialLogin, createBiconomySmartAccount } from '@/lib/biconomy';
import { createWalletClient, custom, Address } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';

interface AuthContextType {
  address: Address | undefined;
  isWalletConnected: boolean;
  isSocialConnected: boolean;
  smartAccount: any;
  isLoggingIn: boolean;
  loginWithSocial: () => Promise<void>;
  logout: () => Promise<void>;
  isSessionActive: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function ZenithAuthProvider({ children }: { children: React.ReactNode }) {
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [socialProvider, setSocialProvider] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const session = localStorage.getItem('zenith_session');
    if (session) {
      // Logic for session restoration could go here
    }
  }, []);

  const loginWithSocial = async () => {
    setIsLoggingIn(true);
    try {
      const particle = await initSocialLogin();
      if (!particle) throw new Error("Init failed");
      
      const userInfo = await particle.auth.login();
      const { ParticleProvider } = await import("@particle-network/provider");
      const provider = new ParticleProvider(particle.auth);
      
      const accounts = await provider.request({ method: 'eth_accounts' }) as Address[];
      const address = accounts[0];

      const wc = createWalletClient({
        account: address,
        chain: process.env.NEXT_PUBLIC_NETWORK === 'amoy' ? polygonAmoy : polygon,
        transport: custom(provider)
      });

      const sa = await createBiconomySmartAccount(wc);
      setSmartAccount(sa);
      setSocialProvider(particle);
      localStorage.setItem('zenith_session', JSON.stringify({ type: 'social', address }));
    } catch (error) {
      console.error('[Auth] Social login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    setSmartAccount(null);
    if (socialProvider) {
      try { await socialProvider.auth.logout(); } catch (e) {}
    }
    setSocialProvider(null);
    disconnect();
    localStorage.removeItem('zenith_session');
  };

  const isSocialConnected = !!smartAccount && !isWagmiConnected;
  const address = smartAccount?.accountAddress || wagmiAddress;
  const isSessionActive = isHydrated && (isWagmiConnected || !!smartAccount);

  return (
    <AuthContext.Provider value={{
      address,
      isWalletConnected: isWagmiConnected,
      isSocialConnected,
      smartAccount,
      isLoggingIn,
      loginWithSocial,
      logout,
      isSessionActive
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useZenithAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useZenithAuth must be used within ZenithAuthProvider');
  return context;
};
