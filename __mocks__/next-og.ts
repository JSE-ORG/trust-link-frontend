/**
 * Mock for next/og in the Vitest jsdom environment.
 *
 * next/og's ImageResponse is an Edge-runtime API that renders React trees to
 * PNG. In jsdom tests we just need to verify the handler's HTTP contract, so
 * we replace it with a minimal Response subclass that returns a fake PNG
 * header with the correct content-type.
 */

export class ImageResponse extends Response {
  constructor(
    _element: unknown,
    options?: { width?: number; height?: number; headers?: Record<string, string> }
  ) {
    // Return a 1×1 transparent PNG so content-type and status are valid.
    const fakePng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    super(fakePng, {
      status: 200,
      headers: {
        "content-type": "image/png",
        ...(options?.headers ?? {}),
      },
    });
  }
}
