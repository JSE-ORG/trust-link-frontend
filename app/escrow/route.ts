import { NextResponse } from "next/server";

import { getVendorEscrows } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  const data = await getVendorEscrows();
  return NextResponse.json(data);
}
