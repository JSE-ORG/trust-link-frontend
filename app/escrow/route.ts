import { NextResponse } from "next/server";
import { getEscrowItems } from "@/lib/escrowStore";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  return NextResponse.json(getEscrowItems());
}
