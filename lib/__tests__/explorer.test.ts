import { afterEach, describe, expect, it } from "vitest";

import {
  getStellarExpertAccountUrl,
  getStellarExpertTxUrl,
  getStellarExpertUrl,
} from "../explorer";

describe("explorer utility", () => {
  const originalEnv = process.env.NEXT_PUBLIC_STELLAR_NETWORK;

  afterEach(() => {
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = originalEnv;
  });

  describe("getStellarExpertUrl", () => {
    it("returns testnet contract url by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      const url = getStellarExpertUrl("CA123");
      expect(url).toBe("https://stellar.expert/explorer/testnet/contract/CA123");
    });

    it("returns public contract url when network is mainnet", () => {
      const url = getStellarExpertUrl("CA123", "mainnet");
      expect(url).toBe("https://stellar.expert/explorer/public/contract/CA123");
    });

    it("returns public contract url when network is public", () => {
      const url = getStellarExpertUrl("CA123", "public");
      expect(url).toBe("https://stellar.expert/explorer/public/contract/CA123");
    });
  });

  describe("getStellarExpertAccountUrl", () => {
    it("returns testnet account url by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      const url = getStellarExpertAccountUrl("GA123");
      expect(url).toBe("https://stellar.expert/explorer/testnet/account/GA123");
    });

    it("returns public account url when network is mainnet", () => {
      const url = getStellarExpertAccountUrl("GA123", "mainnet");
      expect(url).toBe("https://stellar.expert/explorer/public/account/GA123");
    });

    it("returns public account url when env is mainnet", () => {
      process.env.NEXT_PUBLIC_STELLAR_NETWORK = "mainnet";
      const url = getStellarExpertAccountUrl("GA123");
      expect(url).toBe("https://stellar.expert/explorer/public/account/GA123");
    });
  });

  describe("getStellarExpertTxUrl", () => {
    it("returns testnet tx url by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      const url = getStellarExpertTxUrl("TX123");
      expect(url).toBe("https://stellar.expert/explorer/testnet/tx/TX123");
    });

    it("returns public tx url when network is mainnet", () => {
      const url = getStellarExpertTxUrl("TX123", "mainnet");
      expect(url).toBe("https://stellar.expert/explorer/public/tx/TX123");
    });
  });
});
