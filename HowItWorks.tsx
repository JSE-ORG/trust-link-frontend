import React, { memo } from "react";
import { ShieldCheck, Truck, CheckCircle2 } from "lucide-react";
import i18n from "@/lib/i18n";

export const HowItWorks = memo(function HowItWorks() {
  const steps = [
    {
      title: i18n.t("payment.howItWorksStep1Title"),
      description: i18n.t("payment.howItWorksStep1Description"),
      icon: ShieldCheck,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      title: i18n.t("payment.howItWorksStep2Title"),
      description: i18n.t("payment.howItWorksStep2Description"),
      icon: Truck,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
    },
    {
      title: i18n.t("payment.howItWorksStep3Title"),
      description: i18n.t("payment.howItWorksStep3Description"),
      icon: CheckCircle2,
      color: "text-green-500 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
  ];

  return (
    <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-6 text-xl font-semibold text-zinc-950 dark:text-white">
        {i18n.t("payment.howItWorksTitle")}
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
});
