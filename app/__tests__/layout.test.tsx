import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import RootLayout from "../layout";
import { AppProviders } from "@/components/providers/AppProviders";
import { useWallet } from "@/components/providers/WalletProvider";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next font
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock Next.js router and other hooks if needed
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/components/providers/ServiceWorkerProvider", () => ({
  ServiceWorkerProvider: () => <div data-testid="service-worker-provider" />
}));

// Components to test providers
const WalletConsumer = () => {
  const wallet = useWallet();
  return <div data-testid="wallet-consumer">{wallet ? "Wallet Ready" : "No Wallet"}</div>;
};

const ThemeConsumer = () => {
  const { theme } = useTheme();
  return <div data-testid="theme-consumer">{theme || "No Theme"}</div>;
};

const QueryConsumer = () => {
  const { data } = useQuery({ queryKey: ["test"], queryFn: () => "Query Ready", staleTime: 0 });
  return <div data-testid="query-consumer">{data || "Loading"}</div>;
};

const ToastConsumer = () => {
  useEffect(() => {
    toast.success("Toast Ready");
  }, []);
  return <div data-testid="toast-consumer">Toast Triggered</div>;
};

describe("RootLayout & AppProviders", () => {
  
  describe("Provider Dependencies (Success Cases)", () => {
    it("WalletProvider is mounted and useWallet does not throw", () => {
      render(
        <AppProviders>
          <WalletConsumer />
        </AppProviders>
      );
      expect(screen.getByTestId("wallet-consumer")).toBeInTheDocument();
    });

    it("ThemeProvider is mounted and useTheme returns a theme", () => {
      render(
        <AppProviders>
          <ThemeConsumer />
        </AppProviders>
      );
      expect(screen.getByTestId("theme-consumer")).toHaveTextContent("dark");
    });

    it("QueryClientProvider is mounted and useQuery executes successfully", async () => {
      render(
        <AppProviders>
          <QueryConsumer />
        </AppProviders>
      );
      await waitFor(() => {
        expect(screen.getByTestId("query-consumer")).toHaveTextContent("Query Ready");
      });
    });

    it("Toaster is mounted and renders toast when triggered", async () => {
      const ToastTrigger = () => (
        <button onClick={() => toast.success("Toast Ready")} data-testid="toast-trigger">
          Trigger
        </button>
      );

      render(
        <RootLayout>
          <ToastTrigger />
        </RootLayout>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("toast-trigger"));

      await waitFor(() => {
        expect(screen.getByText("Toast Ready")).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe("Failure Verification Tests (Throws without providers)", () => {
    // Suppress console.error for expected errors during rendering
    let consoleError: any;
    beforeAll(() => {
      consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterAll(() => {
      consoleError.mockRestore();
    });

    it("useWallet throws an error when WalletProvider is removed", () => {
      expect(() => render(<WalletConsumer />)).toThrow();
    });

    it("useQuery throws an error when QueryClientProvider is removed", () => {
      expect(() => render(<QueryConsumer />)).toThrow();
    });
    
    it("useTheme might not throw, but we verify it's missing the theme context", () => {
      // next-themes useTheme doesn't strictly throw if missing, it might just be undefined.
      // So we test that without ThemeProvider, it doesn't give 'dark'.
      const { getByTestId } = render(<ThemeConsumer />);
      expect(getByTestId("theme-consumer")).toHaveTextContent("No Theme");
    });
  });

  describe("Layout Component Structure", () => {
    it("renders required layout components and children", () => {
      // Testing RootLayout directly in RTL can be tricky with html/body tags
      // We will render it and check for the main content block and components
      const { container } = render(
        <RootLayout>
          <div data-testid="layout-child">Child Content</div>
        </RootLayout>
      );

      // Verify layout shell elements
      expect(screen.getByTestId("layout-child")).toBeInTheDocument();
      expect(screen.getByText("TrustLink")).toBeInTheDocument(); // Navbar
      
      // Verify main content landmark
      const mainElement = document.getElementById('main-content') || container.querySelector('main#main-content');
      expect(mainElement).toBeInTheDocument();
    });
  });
});
