import escrowsFixture from "../fixtures/escrows.json";

export const VENDOR_KEY = "GCFM4VENDOR8TESTING1234567890ABCDEF";
export const BUYER_KEY = "GBUYER8TESTING1234567890ABCDEF";
/** The session token the mocked `/auth/verify` returns; must be decodable by
 *  `jwtDecode`, or `WalletProvider` treats the session as unusable and clears it. */
export const JWT: string = escrowsFixture.authVerify.token;
export const TRACKING_ID = "TRACK-123";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const VENDOR_ID = "vendor_test_1";
export const BUYER_ID = "buyer_test_1";
export const MOCK_TX_HASH = "abc123def456tx789hash_mock_payment_confirmed";
