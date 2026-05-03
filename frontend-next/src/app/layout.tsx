import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolyLance Zenith | Security-First Freelance Protocol",
  description: "The venture-grade decentralized marketplace for high-integrity software delivery on Polygon.",
};

import { ZenithAuthProvider } from "@/context/AuthContext";
import AuthWrapper from "@/components/AuthWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} min-h-full font-sans`}>
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
