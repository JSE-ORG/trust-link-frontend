import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { SubscriptionProvider } from "@/components/providers/SubscriptionProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import I18nProvider from "@/components/providers/I18nProvider";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TestnetBanner from "@/components/layout/TestnetBanner";
import OfflineBanner from "@/components/layout/OfflineBanner";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { Toaster } from "sonner";
import { Suspense } from "react";
import TopProgressBar from "@/components/ui/TopProgressBar";
import CommandPalette from "@/components/ui/CommandPalette";
import { ThemeProvider } from "next-themes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import CommandPalette from "@/components/ui/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://trustlink.app"),
  title: "TrustLink",
  description: "The Web2 experience. The Web3 guarantee.",
};

export const viewport = {
  themeColor: "#1B2A6B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          next/font/google self-hosts the woff2 files in the Next.js static
          bundle, so preconnect to fonts.googleapis.com / fonts.gstatic.com is
          not needed at runtime.  The font CSS is also inlined at build time
          (display:swap, preload:true above).

          We still DNS-prefetch the Soroban RPC and API origins so those
          lookups are already resolved when the first wallet operation fires.
        */}
        <link rel="dns-prefetch" href="https://soroban-testnet.stellar.org" />
        <link rel="dns-prefetch" href="https://horizon-testnet.stellar.org" />
      </head>
      {/* Inline script runs before paint to apply stored theme class without flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`,
        }}
      />
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <NetworkProvider>
          <ServiceWorkerProvider />
          <OfflineBanner />
          <TestnetBanner />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-black focus:font-semibold"
          >
            Skip to content
          </a>
          <WalletProvider>
            <SubscriptionProvider>
              <I18nProvider>
                <NotificationProvider>
                  <Navbar />
                  <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col pb-20 md:pb-0 outline-none">
                    {children}
                  </main>
                  <Footer />
                  <BottomNav />
                  <Toaster richColors position="top-right" />
                </NotificationProvider>
              </I18nProvider>
            </SubscriptionProvider>
          </WalletProvider>
        </NetworkProvider>
        <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
