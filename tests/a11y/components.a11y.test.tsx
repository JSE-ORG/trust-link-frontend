import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EmptyVendorState from "@/components/dashboard/EmptyVendorState";
import DisputeForm from "@/components/escrow/DisputeForm";
import BottomNav from "@/components/layout/BottomNav";
import Navbar from "@/components/layout/Navbar";
import I18nProvider from "@/components/providers/I18nProvider";
import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import {
  WalletContext,
  type WalletContextType,
  WalletProvider,
} from "@/components/providers/WalletProvider";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/button";
import CommandPalette from "@/components/ui/CommandPalette";
import { Skeleton } from "@/components/ui/Skeleton";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

const { navMocks } = vi.hoisted(() => ({
  navMocks: {
    pathname: "/dashboard",
    push: vi.fn(),
    unreadCount: 0,
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navMocks.pathname,
  useRouter: () => ({
    push: navMocks.push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/components/providers/I18nProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/providers/NetworkProvider", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/providers/NetworkProvider")
  >("@/components/providers/NetworkProvider");
  return {
    ...actual,
    NetworkProvider: ({ children }: { children: React.ReactNode }) => (
      <actual.NetworkProvider>{children}</actual.NetworkProvider>
    ),
  };
});

vi.mock("@/components/providers/NotificationProvider", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useNotifications: () => ({
    notifications: [],
    unreadCount: navMocks.unreadCount,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    isLoading: false,
    error: null,
    hasLoaded: true,
    refetch: vi.fn().mockResolvedValue(undefined),
  }),
}));

const defaultWalletState: WalletContextType = {
  publicKey: null,
  token: null,
  jwt: null,
  isConnected: false,
  isInstalled: true,
  status: "disconnected",
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn(),
  signTransaction: vi.fn().mockResolvedValue("signed-xdr"),
  isLoading: false,
  walletReady: true,
  error: null,
};

let currentWalletState: WalletContextType = { ...defaultWalletState };

vi.mock("@/components/providers/WalletProvider", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/providers/WalletProvider")
  >("@/components/providers/WalletProvider");
  return {
    ...actual,
    WalletProvider: ({ children }: { children: React.ReactNode }) => (
      <actual.WalletContext.Provider value={currentWalletState}>
        {children}
      </actual.WalletContext.Provider>
    ),
  };
});

expect.extend(toHaveNoViolations);

const WCAG_AXE_OPTIONS = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
  rules: { "color-contrast": { enabled: false } },
};

function NavigationTestProviders({
  children,
  walletOverrides,
}: {
  children: React.ReactNode;
  walletOverrides?: Partial<WalletContextType>;
}) {
  const value = walletOverrides
    ? { ...currentWalletState, ...walletOverrides }
    : currentWalletState;
  return (
    <I18nProvider>
      <NetworkProvider>
        <WalletContext.Provider value={value}>
          <NotificationProvider>{children}</NotificationProvider>
        </WalletContext.Provider>
      </NetworkProvider>
    </I18nProvider>
  );
}

/**
 * Run axe against WCAG 2.0/2.1 A and AA rule sets. We scope to the WCAG tags
 * (rather than axe's "best-practice" rules) so the suite asserts conformance
 * issues, and we drop colour-contrast — it cannot be computed reliably in
 * jsdom because there is no real layout/paint.
 */
async function expectNoA11yViolations(ui: React.ReactElement) {
  const { container } = render(ui);
  const results = await axe(container, WCAG_AXE_OPTIONS);
  expect(results).toHaveNoViolations();
  return container;
}

describe("accessibility — UI components have no axe violations", () => {
  beforeEach(() => {
    navMocks.pathname = "/dashboard";
    navMocks.unreadCount = 0;
    navMocks.push.mockReset();
    currentWalletState = { ...defaultWalletState };
  });

  it("Breadcrumb", async () => {
    await expectNoA11yViolations(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Track Order", href: "/tracking" },
          { label: "Order esc_1234567890" },
        ]}
      />
    );
  });

  it("Badge", async () => {
    await expectNoA11yViolations(<Badge>Active</Badge>);
  });

  it("Button", async () => {
    await expectNoA11yViolations(<Button>Submit payment</Button>);
  });

  it("Button (disabled)", async () => {
    await expectNoA11yViolations(<Button disabled>Mark shipped</Button>);
  });

  it("Skeleton", async () => {
    await expectNoA11yViolations(
      <div role="status" aria-label="Loading">
        <Skeleton className="h-4 w-24" />
      </div>
    );
  });

  it("EmptyVendorState", async () => {
    await expectNoA11yViolations(<EmptyVendorState />);
  });

  describe("Navbar — WCAG 2.1 AA axe & landmark semantics", () => {
    it("passes axe checks and exposes banner, navigation, and switch ARIA labels", async () => {
      render(
        <NavigationTestProviders>
          <WalletProvider>
            <Navbar />
          </WalletProvider>
        </NavigationTestProviders>
      );

      const banner = screen.getByRole("banner");
      expect(banner).toBeInTheDocument();

      const desktopNav = screen.getByRole("navigation", {
        name: "Desktop navigation",
      });
      expect(desktopNav).toHaveAttribute("aria-label", "Desktop navigation");
      expect(
        screen.getByRole("link", { name: "TrustLink home" })
      ).toHaveAttribute("aria-label", "TrustLink home");
      expect(
        screen.getByRole("link", { name: "Dashboard" })
      ).toHaveAttribute("aria-current", "page");

      const networkSwitch = screen.getByRole("switch", {
        name: /switch to mainnet/i,
      });
      expect(networkSwitch).toHaveAttribute("aria-checked", "false");

      const results = await axe(banner, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });

  describe("BottomNav — WCAG 2.1 AA axe & mobile landmark semantics", () => {
    it("passes axe checks with mobile navigation role, aria-label, and unread badge label", async () => {
      navMocks.pathname = "/notifications";
      navMocks.unreadCount = 5;

      const { container } = render(
        <NavigationTestProviders>
          <BottomNav />
        </NavigationTestProviders>
      );

      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav).toHaveAttribute("role", "navigation");
      expect(mobileNav).toHaveAttribute("aria-label", "Mobile navigation");

      const inboxLink = screen.getByRole("link", { name: "Inbox, 5 unread" });
      expect(inboxLink).toHaveAttribute("aria-current", "page");

      const results = await axe(container, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });

  describe("WalletConnectButton — WCAG 2.1 AA axe across connection states", () => {
    it("passes axe when disconnected (default and navbar variants)", async () => {
      await expectNoA11yViolations(
        <NavigationTestProviders>
          <div>
            <WalletConnectButton />
            <WalletConnectButton variant="navbar" />
          </div>
        </NavigationTestProviders>
      );
      expect(
        screen.getAllByRole("button", { name: /connect wallet/i })
      ).toHaveLength(2);
    });

    it("passes axe when Freighter is not installed (install link state)", async () => {
      await expectNoA11yViolations(
        <NavigationTestProviders walletOverrides={{ isInstalled: false }}>
          <WalletConnectButton />
        </NavigationTestProviders>
      );
      expect(
        screen.getByRole("link", { name: /install freighter/i })
      ).toBeInTheDocument();
    });

    it("passes axe when connected and when account menu is expanded", async () => {
      const user = userEvent.setup();
      const connectedKey =
        "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
      const { container } = render(
        <NavigationTestProviders
          walletOverrides={{
            isConnected: true,
            publicKey: connectedKey,
            status: "connected",
          }}
        >
          <WalletConnectButton variant="navbar" />
        </NavigationTestProviders>
      );

      const trigger = screen.getByRole("button", { name: /GBZX\.\.\.MADI/i });
      expect(trigger).toHaveAttribute("aria-haspopup", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      const closedResults = await axe(container, WCAG_AXE_OPTIONS);
      expect(closedResults).toHaveNoViolations();

      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();

      const openResults = await axe(container, WCAG_AXE_OPTIONS);
      expect(openResults).toHaveNoViolations();
    });
  });

  describe("CommandPalette — WCAG 2.1 AA axe & dialog/combobox semantics", () => {
    it("passes axe when opened via Ctrl+K and when filtered to empty status", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <NavigationTestProviders>
          <CommandPalette />
        </NavigationTestProviders>
      );

      fireEvent.keyDown(document, { key: "k", ctrlKey: true });

      const dialog = screen.getByRole("dialog", { name: "Command palette" });
      expect(dialog).toHaveAttribute("aria-modal", "true");

      const searchCombobox = screen.getByRole("combobox", {
        name: "Search commands",
      });
      expect(searchCombobox).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("listbox", { name: "Commands" })
      ).toBeInTheDocument();

      const openResults = await axe(container, WCAG_AXE_OPTIONS);
      expect(openResults).toHaveNoViolations();

      await user.type(searchCombobox, "zzzz-no-matching-route");
      expect(screen.getByRole("status")).toHaveTextContent("No results found.");

      const emptyResults = await axe(container, WCAG_AXE_OPTIONS);
      expect(emptyResults).toHaveNoViolations();
    });
  });

  describe("DisputeForm — all 4 steps pass axe", () => {
    it("step 1 (Info)", async () => {
      const { container } = render(<DisputeForm />);
      const results = await axe(container, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it("step 2 (Details)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it("step 3 (Evidence)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      await user.selectOptions(screen.getByLabelText(/reason/i), "damaged_product");
      await user.type(
        screen.getByLabelText(/description/i),
        "The item arrived damaged and is unusable"
      );
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    }, 15000);

    it("step 4 (Review)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      await user.selectOptions(screen.getByLabelText(/reason/i), "damaged_product");
      await user.type(
        screen.getByLabelText(/description/i),
        "The item arrived damaged and is unusable"
      );
      await user.click(screen.getByTestId("next-button"));
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, WCAG_AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    }, 15000);
  });
});
