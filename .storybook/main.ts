import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: { name: "@storybook/react-vite", options: {} },
  docs: { autodocs: true },
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      plugins: [tsconfigPaths()],
    });
  },
};

export default config;
