import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import I18nProvider from "@/components/providers/I18nProvider";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TestnetBanner from "@/components/layout/TestnetBanner";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustLink",
  description: "The Web2 experience. The Web3 guarantee.",
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
      <body className="min-h-full flex flex-col">
        <TestnetBanner />
        <ServiceWorkerProvider />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-black focus:font-semibold"
        >
          Skip to content
        </a>
        <WalletProvider>
          <NotificationProvider>
            <I18nProvider>
              <Navbar />
              {/* pb-20 on mobile gives room for the fixed BottomNav; md:pb-0 removes it on desktop */}
              <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col pb-20 md:pb-0 outline-none">
                {children}
              </main>
              <Footer />
              <BottomNav />
              <Toaster richColors position="top-right" />
            </I18nProvider>
          </NotificationProvider>
        </WalletProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
