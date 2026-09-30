import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { shipEscrow } from "@/lib/escrowStore";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

// Validation schema for ship request
const ShipRequestSchema = z.object({
  trackingId: z.string().trim().min(1, "Tracking ID is required").max(64, "Tracking ID must be 64 characters or less"),
  carrier: z.string().trim().min(1, "Carrier is required").max(50, "Carrier must be 50 characters or less").optional().default("Other"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, RATE_LIMITS.ship.limit, RATE_LIMITS.ship.windowMs);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const validation = ShipRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    // For backwards compatibility with existing tests, return simple message for known fields
    if (errors.trackingId) {
      return NextResponse.json({ message: errors.trackingId[0] }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Validation failed", errors },
      { status: 400 }
    );
  }

  const { trackingId, carrier } = validation.data;
  const { id } = await params;

  try {
    const shippedItem = shipEscrow(id, trackingId, carrier);
    return NextResponse.json(shippedItem);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to ship escrow." }, { status: 404 });
  }
}
