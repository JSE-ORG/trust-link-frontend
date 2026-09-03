import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const amount = searchParams.get('amount');
    const status = searchParams.get('status');

    return new ImageResponse(
      (
        <div className="h-full w-full flex flex-col items-start justify-center bg-[#1B2A6B] p-[80px] relative">
          <div className="flex flex-col text-white w-full">
            <h1 className="text-[60px] font-bold m-0 mb-[20px]">
              {title || 'TrustLink Escrow'}
            </h1>
            
            {amount && (
              <div className="text-[40px] mt-[20px] text-[#38bdf8]">
                Amount: {amount} USDC
              </div>
            )}
            
            {status && (
              <div className="text-[32px] mt-[20px] bg-white/10 px-[20px] py-[10px] rounded-[20px] flex w-max">
                Status: {status}
              </div>
            )}
          </div>
          <div className="absolute bottom-[40px] right-[80px] text-white text-[24px] opacity-80">
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
