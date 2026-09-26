/**
 * Fuzzer targets functionality
 * Improves user experience by providing robust fuzz testing utilities
 * for our form inputs and components.
 */

export function fuzzString(maxLength: number = 255): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const length = Math.floor(Math.random() * maxLength);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function fuzzNumber(min: number = -1000000, max: number = 1000000): number {
  return Math.random() * (max - min) + min;
}

export function fuzzEmail(): string {
  const user = fuzzString(10).replace(/[^a-zA-Z0-9]/g, '') || 'user';
  const domain = fuzzString(5).replace(/[^a-zA-Z0-9]/g, '') || 'example';
  const tld = ['com', 'org', 'net', 'io'][Math.floor(Math.random() * 4)];
  return `${user}@${domain}.${tld}`;
}

export const FuzzerTargets = {
  fuzzString,
  fuzzNumber,
  fuzzEmail,
};
