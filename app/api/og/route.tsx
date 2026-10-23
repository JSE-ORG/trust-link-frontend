import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rateLimit';



export async function GET(request: NextRequest) {
  // Rasterising an ImageResponse is CPU-bound, so it is rate-limited and
  // requires an authenticated caller before any rendering happens.
  const limited = await enforceRateLimit(
    request,
    RATE_LIMITS.og.limit,
    RATE_LIMITS.og.windowMs,
    "og:image"
  );
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const amount = searchParams.get('amount');
    const status = searchParams.get('status');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#1B2A6B',
            padding: '80px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              color: '#ffffff',
              width: '100%',
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                margin: 0,
                marginBottom: 20,
              }}
            >
              {title || 'TrustLink Escrow'}
            </h1>

            {amount && (
              <div
                style={{
                  fontSize: 40,
                  marginTop: 20,
                  color: '#38bdf8',
                  display: 'flex',
                }}
              >
                Amount: {amount} USDC
              </div>
            )}

            {status && (
              <div
                style={{
                  fontSize: 32,
                  marginTop: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '10px 20px',
                  borderRadius: 20,
                  display: 'flex',
                  width: 'auto',
                }}
              >
                Status: {status}
              </div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 80,
              color: '#ffffff',
              fontSize: 24,
              opacity: 0.8,
              display: 'flex',
            }}
          >
            TrustLink - Secure Escrows
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.error('Failed to generate OG image', e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
