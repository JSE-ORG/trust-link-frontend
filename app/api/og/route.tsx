import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', color: 'white', width: '100%' }}>
            <h1 style={{ fontSize: 60, fontWeight: 700, margin: '0 0 20px 0' }}>
              {title || 'TrustLink Escrow'}
            </h1>
            
            {amount && (
              <div style={{ fontSize: 40, marginTop: 20, color: '#38bdf8' }}>
                Amount: {amount} USDC
              </div>
            )}
            
            {status && (
              <div style={{ 
                fontSize: 32, 
                marginTop: 20, 
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '10px 20px',
                borderRadius: '20px',
                display: 'flex',
                width: 'fit-content'
              }}>
                Status: {status}
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 40, right: 80, color: 'white', fontSize: 24, opacity: 0.8 }}>
            TrustLink - Secure Escrows
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Failed to generate OG image', e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
