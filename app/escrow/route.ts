import { NextResponse } from "next/server";
import { getEscrowItems } from "@/lib/escrowStore";

export function GET() {
  return NextResponse.json(getEscrowItems());
}
