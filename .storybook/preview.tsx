import "../app/globals.css";

import type { Decorator, Parameters } from "@storybook/react";
import React, { useEffect } from "react";

import { NetworkProvider } from "../components/providers/NetworkProvider";
import { setupStorybookFetchMock } from "./mock-api";
import { MockWalletProvider } from "./mock-wallet";

// Ensure global fetch mocks are established in the browser environment
if (typeof window !== "undefined") {
  setupStorybookFetchMock();
}

export const parameters: Parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: { expanded: true },
};

export const decorators: Decorator[] = [
  (Story, context) => {
    const walletParams = context.parameters?.wallet;
    const mockApiParams = context.parameters?.mockApi;

    useEffect(() => {
      if (mockApiParams) {
        setupStorybookFetchMock(mockApiParams);
      }
    }, [mockApiParams]);

    // This file is .ts, so it cannot contain JSX.
    return React.createElement(
      NetworkProvider,
      null,
      React.createElement(MockWalletProvider, { ...walletParams }, React.createElement(Story))
    );
  },
];
