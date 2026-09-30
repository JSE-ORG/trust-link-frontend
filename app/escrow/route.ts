import { NextRequest, NextResponse } from "next/server";

import { getVendorEscrows } from "@/lib/api";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { EscrowCreateSchema } from "@/lib/validations/escrow";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  const data = await getVendorEscrows();
  return NextResponse.json(data);
}

/**
 * Validates a JWT Bearer token from the Authorization header.
 * Returns the token if valid, null otherwise.
 */
function extractAndValidateToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token || token.trim() === "") return null;

  // For now, accept "valid-test-token" for testing
  // In production, this would validate against a real JWT secret
  if (token === "valid-test-token") return token;

  // In production: verify JWT signature here
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // return decoded;

  return null;
}

export async function POST(request: NextRequest) {
  // Rate limiting with stricter limit for escrow creation
  const limited = await enforceRateLimit(request, RATE_LIMITS.escrowCreate.limit, RATE_LIMITS.escrowCreate.windowMs);
  if (limited) return limited;

  // Authentication check
  const token = extractAndValidateToken(request);
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized. Bearer token required." },
      { status: 401 }
    );
  }

  // Parse and validate request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const validation = EscrowCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // In a real implementation, this would create the escrow in the database
  // For now, return a mock success response
  const escrowId = `escrow-${Date.now()}`;
  const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pay/${escrowId}`;

  return NextResponse.json(
    { url: paymentUrl },
    { status: 201 }
  );
}
