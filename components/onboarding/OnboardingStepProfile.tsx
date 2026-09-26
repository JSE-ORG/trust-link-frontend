"use client";

interface ProfileErrors {
  shopName?: string;
  description?: string;
  website?: string;
}

interface OnboardingStepProfileProps {
  shopName: string;
  description: string;
  website: string;
  shippingLocations: string;
  errors: ProfileErrors;
  onChange: (
    field: "shopName" | "description" | "website" | "shippingLocations",
    value: string
  ) => void;
}

export default function OnboardingStepProfile({
  shopName,
  description,
  website,
  shippingLocations,
  errors,
  onChange,
}: OnboardingStepProfileProps) {
  return (
    <form className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Vendor Profile</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Share your business details so buyers can trust your store.
        </p>
      </div>

      <div className="space-y-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Shop name
          <input
            id="shop-name"
            name="shopName"
            value={shopName}
            onChange={(event) => onChange("shopName", event.target.value)}
            aria-invalid={!!errors.shopName}
            aria-describedby={errors.shopName ? "shopName-error" : undefined}
            className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
            placeholder="Example: Stellar Craft Co."
            required
          />
          {errors.shopName && (
            <p id="shopName-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.shopName}
            </p>
          )}
        </label>

        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
          <textarea
            id="shop-description"
            name="description"
            value={description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={5}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : "description-hint"}
            className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
            placeholder="Tell buyers why they should choose your products."
            required
          />
          {errors.description && (
            <p id="description-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
          {!errors.description && (
            <p id="description-hint" className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Minimum 20 characters required.
            </p>
          )}
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Website
            <input
              id="shop-website"
              name="website"
              value={website}
              onChange={(event) => onChange("website", event.target.value)}
              aria-invalid={!!errors.website}
              aria-describedby={errors.website ? "website-error" : undefined}
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
              placeholder="https://"
            />
            {errors.website && (
              <p id="website-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.website}
              </p>
            )}
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Shipping destinations
            <input
              id="shipping-locations"
              name="shippingLocations"
              value={shippingLocations}
              onChange={(event) => onChange("shippingLocations", event.target.value)}
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
              placeholder="Worldwide, US only, EU only"
            />
          </label>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Description must be at least 20 characters.
        </p>
      </div>
    </form>
  );
}
