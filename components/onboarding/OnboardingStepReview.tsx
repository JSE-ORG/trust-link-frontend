"use client";

interface OnboardingStepReviewProps {
  shopName: string;
  description: string;
  website: string;
  shippingLocations: string;
}

export default function OnboardingStepReview({
  shopName,
  description,
  website,
  shippingLocations,
}: OnboardingStepReviewProps) {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Review Your Store</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Confirm the details before you complete onboarding.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Shop name</p>
          <p className="mt-3 text-base font-semibold text-zinc-950 dark:text-white">{shopName || "Not provided"}</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Shipping destinations</p>
          <p className="mt-3 text-base font-semibold text-zinc-950 dark:text-white">{shippingLocations || "Worldwide"}</p>
        </div>
        <div className="sm:col-span-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Description</p>
          <p className="mt-3 text-base leading-7 text-zinc-950 dark:text-white">{description || "No description yet."}</p>
        </div>
        <div className="sm:col-span-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Website</p>
          <p className="mt-3 text-base text-zinc-950 dark:text-white">{website || "Not listed"}</p>
        </div>
      </div>
    </div>
  );
}
