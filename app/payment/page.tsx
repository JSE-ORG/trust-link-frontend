import ErrorBoundary from "@/components/layout/ErrorBoundary";
import PaymentSection from "@/components/payment/PaymentSection";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Payment</h1>
        <ErrorBoundary>
          <PaymentSection />
        </ErrorBoundary>
      </div>
    </main>
  );
}
