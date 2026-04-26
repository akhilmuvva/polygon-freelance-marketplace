import React from 'react';
import { ZenithVault } from '@/components/ZenithVault';

export const metadata = {
  title: 'Asset Vault | PolyLance Zenith',
  description: 'Sovereign treasury and secure asset custody layer for the Zenith Protocol.',
};

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <ZenithVault />
    </main>
  );
}
