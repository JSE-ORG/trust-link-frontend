import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: {
    // Disable PostCSS processing in the Vitest/jsdom environment.
    // The @tailwindcss/postcss plugin requires a native binding that is not
    // available in CI / the jsdom test runner. CSS is irrelevant to unit and
    // accessibility tests, so we bypass the pipeline entirely.
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      // ── Next.js module shims for the Vitest / jsdom environment ──────────
      // These modules rely on the Next.js runtime or webpack code-splitting
      // and cannot be resolved by Vite directly. Each alias points to a
      // lightweight stub in __mocks__/ that satisfies the same public API.
      "next/image": path.resolve(__dirname, "./__mocks__/next-image.tsx"),
      "next/link": path.resolve(__dirname, "./__mocks__/next-link.tsx"),
      "next/navigation": path.resolve(__dirname, "./__mocks__/next-navigation.ts"),
      "next/server": path.resolve(__dirname, "./__mocks__/next-server.ts"),
      "next/dynamic": path.resolve(__dirname, "./__mocks__/next-dynamic.tsx"),
      "next/og": path.resolve(__dirname, "./__mocks__/next-og.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/e2e/**", "**/tests/e2e/**", "**/node_modules/**"],
    css: false,
  },
});
