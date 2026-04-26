import React from 'react';
import { OracleDashboard } from '@/components/OracleDashboard';

export const metadata = {
  title: 'Zenith Security Oracle | PolyLance',
  description: 'Real-time smart contract telemetry and decentralized threat detection.',
};

export default function OraclePage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <OracleDashboard />
    </main>
  );
}
