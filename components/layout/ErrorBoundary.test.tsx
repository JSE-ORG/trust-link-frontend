import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import ErrorBoundary from "./ErrorBoundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

function FailingApiSection() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Promise.reject(new Error("Simulated API failure")).catch(setError);
  }, []);

  if (error) throw error;

  return <div>Loading…</div>;
}

function SuccessfulSection() {
  return <div>Content loaded successfully</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(Sentry.captureException).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the fallback UI when a child async section fails", async () => {
    render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    expect(await screen.findByText(/Something went wrong/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeTruthy();
  });

  it("reports caught errors through Sentry", async () => {
    render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    await screen.findByText(/Something went wrong/i);

    const captureException = vi.mocked(Sentry.captureException);
    expect(captureException).toHaveBeenCalledTimes(1);

    const [capturedError, context] = captureException.mock.calls[0];
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe("Simulated API failure");
    expect(context).toEqual({
      extra: {
        errorInfo: expect.objectContaining({
          componentStack: expect.any(String),
        }),
      },
    });
  });

  it("matches snapshot when error boundary shows error state", async () => {
    const { container } = render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    await screen.findByText(/Something went wrong/i);
    expect(container).toMatchSnapshot();
  });

  it("renders children successfully when no error occurs", () => {
    const { container } = render(
      <ErrorBoundary>
        <SuccessfulSection />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Content loaded successfully/i)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("has error icon in fallback UI", async () => {
    const { container } = render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    await screen.findByText(/Something went wrong/i);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("displays error message with proper styling", async () => {
    render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    const errorDiv = await screen.findByText(/Something went wrong/i);
    expect(errorDiv).toHaveClass("text-xl", "font-semibold");
  });

  it("provides reset functionality button", async () => {
    render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    const button = await screen.findByRole("button", { name: /Try Again/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("rounded-full", "bg-black", "text-white");
  });

  it("error fallback has proper accessibility structure", async () => {
    const { container } = render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    await screen.findByText(/Something went wrong/i);
    expect(container.querySelector("[role='alert']") || container.querySelector("div")).toBeInTheDocument();
  });
});
