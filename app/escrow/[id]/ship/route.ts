import { NextResponse } from "next/server";
import { shipEscrow } from "@/lib/escrowStore";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.trackingId !== "string" || body.trackingId.trim() === "") {
    return NextResponse.json({ message: "Tracking ID is required." }, { status: 400 });
  }

  if (body.trackingId.length > 64) {
    return NextResponse.json({ message: "Tracking ID must be 64 characters or less." }, { status: 400 });
  }

  try {
    const shippedItem = shipEscrow(params.id, body.trackingId.trim(), body.carrier ?? "Other");
    return NextResponse.json(shippedItem);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to ship escrow." }, { status: 404 });
  }
}
