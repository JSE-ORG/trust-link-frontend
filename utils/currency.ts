export function formatUSDC(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "0.00 USDC";
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " USDC";
}