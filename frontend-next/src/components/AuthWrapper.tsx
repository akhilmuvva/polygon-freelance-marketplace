'use client';

import React from 'react';
import { useZenithAuth } from "@/context/AuthContext";
import LoginGate from "@/components/LoginGate";
import ZenithShell from "@/components/ZenithShell";
import { ZenithAI } from "@/components/ZenithAI";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isSessionActive } = useZenithAuth();

  if (!isSessionActive) {
    return <LoginGate />;
  }

  return (
    <ZenithShell>
      {children}
      <ZenithAI />
    </ZenithShell>
  );
}
