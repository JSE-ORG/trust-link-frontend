import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import ErrorBoundary from "./ErrorBoundary";

function FailingApiSection() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Promise.reject(new Error("Simulated API failure")).catch(setError);
  }, []);

  if (error) throw error;

  return <div>Loading…</div>;
}

describe("ErrorBoundary", () => {
  it("renders the fallback UI when a child async section fails", async () => {
    render(
      <ErrorBoundary>
        <FailingApiSection />
      </ErrorBoundary>
    );

    expect(await screen.findByText(/Something went wrong/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeTruthy();
  });
});
