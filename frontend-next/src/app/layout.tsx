import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import ZenithShell from "@/components/ZenithShell";
import { ZenithAI } from "@/components/ZenithAI";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolyLance Zenith | Security-First Freelance Protocol",
  description: "The venture-grade decentralized marketplace for high-integrity software delivery on Polygon.",
};

import { ZenithAuthProvider, useZenithAuth } from "@/context/AuthContext";
import LoginGate from "@/components/LoginGate";

function AuthWrapper({ children }: { children: React.ReactNode }) {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full font-sans`}>
        <Web3Provider>
          <ZenithAuthProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </ZenithAuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
