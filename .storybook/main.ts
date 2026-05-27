import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: { name: "@storybook/react-vite", options: {} },
  docs: { autodocs: true },
};

export default config;
