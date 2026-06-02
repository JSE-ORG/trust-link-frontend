"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useWallet from "@/hooks/useWallet";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { ShieldCheck, ArrowRight, Download, Link as LinkIcon } from "lucide-react";

function OnboardingContent() {
  const { status } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    document.title = "Connect Wallet | TrustLink";
    if (status === "connected") {
      router.push(redirect);
    }
  }, [status, router, redirect]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for rich aesthetics */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="max-w-3xl w-full space-y-12 text-center relative z-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center p-5 backdrop-blur-xl border border-white/20 shadow-2xl animate-float">
            <ShieldCheck className="w-14 h-14 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Secure Your Profile
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
              Connect your Stellar wallet to access your dashboard, manage transactions, and verify your identity.
            </p>
          </div>
        </div>

        {status === "not-installed" && (
          <div className="bg-warning/10 border border-warning/20 p-4 rounded-2xl text-warning text-sm font-medium flex items-center justify-center duration-500">
            <Download className="w-4 h-4 mr-2" />
            Freighter extension not detected. Please install it to continue.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
          {/* Card 1: Education */}
          <div className="p-8 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-border/50 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 bg-warning/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download className="w-7 h-7 text-warning" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Get Freighter</h3>
            <p className="text-muted mb-6 leading-relaxed">
              Freighter is your secure gateway to the Stellar network. It handles your keys locally so they never leave your device.
            </p>
            <a 
              href="https://freighter.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-bold text-primary hover:gap-3 transition-all"
            >
              Learn more at freighter.app <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>

          {/* Card 2: Action */}
          <div className="p-8 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-border/50 shadow-xl hover:shadow-2xl transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LinkIcon className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fast Connection</h3>
              <p className="text-muted mb-8 leading-relaxed">
                Connect your account in seconds using the SEP-10 standard. Simple, secure, and decentralized.
              </p>
            </div>
            <div className="flex justify-center md:justify-start">
               <WalletConnectButton />
            </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col items-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center">
            <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
            Vetted Security Standards
          </p>
          <p className="text-sm text-muted/60 max-w-sm">
            Don't have a wallet? Follow the link to install the Freighter extension for your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return <VendorOnboardingWizard />;
}
