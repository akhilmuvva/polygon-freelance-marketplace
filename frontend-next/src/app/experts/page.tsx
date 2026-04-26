import React from 'react';
import { ExpertNetwork } from '@/components/ExpertNetwork';

export const metadata = {
  title: 'Expert Network | PolyLance Protocol',
  description: 'Connect with sovereign architects and decentralized specialists in the Zenith ecosystem.',
};

export default function ExpertsPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <ExpertNetwork />
    </main>
  );
}
