import React from 'react';
import { ZenithLeaderboard } from '@/components/ZenithLeaderboard';

export const metadata = {
  title: 'Protocol Leaderboard | PolyLance Zenith',
  description: 'The Hall of Sovereigns: Celebrating the elite architects and security specialists of the Zenith mesh.',
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <ZenithLeaderboard />
    </main>
  );
}
