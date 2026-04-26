import React from 'react';
import { InitiateMission } from '@/components/InitiateMission';

export const metadata = {
  title: 'Initiate Mission | PolyLance Zenith',
  description: 'Deploy a high-integrity work contract to the Polygon settlement layer.',
};

export default function InitiatePage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <InitiateMission />
    </main>
  );
}
