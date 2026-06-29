import EscrowCreateForm from "@/components/escrow/EscrowCreateForm";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export const metadata = {
  title: "Create Escrow | TrustLink",
  description: "Generate a secure escrow link for your transaction. Connect your wallet and create a shareable payment link in seconds.",
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Vendor workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            Connect your wallet, create the link, share it instantly.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Freighter unlocks the vendor flow. Once connected, you can generate a shareable escrow link
            and hand it to a buyer in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <WalletConnectButton />
          </div>

          <div className="mt-10 grid gap-4 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">1. Connect</p>
              <p className="mt-1">Mocked Freighter flow for reliable CI coverage.</p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">2. Create</p>
              <p className="mt-1">Fill out the escrow details and generate the link.</p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">3. Share</p>
              <p className="mt-1">Copy the URL or scan the QR code to send it fast.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 sm:p-6">
          <EscrowCreateForm />
        </section>
      </div>
    </main>
  );
}
