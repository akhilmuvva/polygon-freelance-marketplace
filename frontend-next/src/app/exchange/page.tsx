import React from 'react';
import { ZenithExchange } from '@/components/ZenithExchange';

export const metadata = {
  title: 'Zenith Exchange | PolyLance Protocol',
  description: 'Sovereign liquidity layer and asset swap protocol for the Zenith ecosystem.',
};

export default function ExchangePage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <ZenithExchange />
    </main>
  );
}
