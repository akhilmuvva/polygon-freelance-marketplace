'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MissionDetails } from '@/components/MissionDetails';

export default function MissionPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <MissionDetails id={id} />
    </main>
  );
}
