/**
 * Mock for next/server in the Vitest jsdom environment.
 *
 * next/server is an Edge/Node-only module. This shim re-exports the Web
 * standard Request/Response so that API route handlers can be imported and
 * tested without the full Next.js runtime.
 */

export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
}

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers instanceof Headers
          ? Object.fromEntries((init.headers as Headers).entries())
          : (init?.headers ?? {})),
      },
    });
  }

  static redirect(url: string | URL, status = 302): NextResponse {
    return new NextResponse(null, {
      status,
      headers: { Location: String(url) },
    });
  }

  static next(): NextResponse {
    return new NextResponse(null, { status: 200 });
  }
}
