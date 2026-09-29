/**
 * Mock for next/navigation in the Vitest jsdom environment.
 *
 * Stubs the router, pathname, search params and params hooks so components
 * that call useRouter / usePathname etc. can render in tests without the
 * real Next.js app router.
 */
import { vi } from "vitest";

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: "/",
  query: {},
}));

export const usePathname = vi.fn(() => "/");

export const useSearchParams = vi.fn(() => new URLSearchParams());

export const useParams = vi.fn(() => ({}));

export const redirect = vi.fn((url: string) => {
  throw new Error(`Redirect to ${url}`);
});

export const notFound = vi.fn(() => {
  throw new Error("Not found");
});

export const useSelectedLayoutSegment = vi.fn(() => null);
export const useSelectedLayoutSegments = vi.fn(() => []);
