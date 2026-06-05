"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import I18nProvider from "@/components/providers/I18nProvider";
import { useState } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <NetworkProvider>
          <WalletProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
          </WalletProvider>
        </NetworkProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
