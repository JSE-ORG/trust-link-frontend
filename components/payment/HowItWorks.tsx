import { ShieldCheck, Truck, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      title: "1. Deposit Funds",
      description: "You fund the secure smart contract. The seller is notified but cannot access the funds yet.",
      icon: ShieldCheck,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      title: "2. Seller Delivers",
      description: "The seller securely ships the item or delivers the service to you as agreed.",
      icon: Truck,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
    },
    {
      title: "3. Funds Released",
      description: "Once you confirm receipt and are satisfied, the funds are released to the seller.",
      icon: CheckCircle2,
      color: "text-green-500 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
  ];

  return (
    <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-6 text-xl font-semibold text-zinc-950 dark:text-white">
        How TrustLink Escrow Works
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${step.bg} ${step.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
