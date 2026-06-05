export function formatUSDC(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "0.00 USDC";
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " USDC";
}
// Example usage:
// console.log(formatUSDC(1234.567)); // Output: "1,234.57 USDC"
// console.log(formatUSDC("5678.9")); // Output: "5,678.90 USDC"
// console.log(formatUSDC(null)); // Output: "0.00 USDC"
// console.log(formatUSDC(undefined)); // Output: "0.00 USDC"
// console.log(formatUSDC("invalid")); // Output: "0.00 USDC"