"use client";

import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { type Config, cookieToInitialState, WagmiProvider } from "wagmi";
import { networks, projectId, wagmiAdapter } from "@/config/wagmi";
import { ViewChainProvider } from "@/context/ViewChainProvider";

// Set up queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: "Tally Launch",
  description: "Launch tokens with TallyLaunchFactory on Uniswap V4",
  url: "https://tally.xyz",
  icons: ["https://avatars.githubusercontent.com/u/72100821"],
};

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeVariables: {
    "--w3m-accent": "#725bff",
    "--w3m-border-radius-master": "2px",
  },
});

interface Web3ProviderProps {
  children: ReactNode;
  cookies: string | null;
}

export function Web3Provider({ children, cookies }: Web3ProviderProps) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ViewChainProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ViewChainProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
