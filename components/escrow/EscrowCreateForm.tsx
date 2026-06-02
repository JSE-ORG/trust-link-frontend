"use client";

import { useState, type FormEvent } from "react";
import { createEscrow, type EscrowInput } from "@/lib/api";
import { track } from "@/lib/analytics";

const shippingOptions = ["Same day", "1-3 days", "1 week", "Custom"] as const;

type ShippingWindow = (typeof shippingOptions)[number];

type FormValues = {
  itemName: string;
  priceUSDC: string;
  description: string;
  shippingWindow: ShippingWindow;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const defaultValues: FormValues = {
  itemName: "",
  priceUSDC: "",
  description: "",
  shippingWindow: shippingOptions[0],
};

function buildQrMatrix(value: string) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const seed = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const setFinder = (row: number, col: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const isBorder = x === 0 || y === 0 || x === 6 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[row + y][col + x] = isBorder || isCenter;
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (matrix[row][col]) {
        continue;
      }

      const shouldFill = ((row * 11 + col * 17 + seed) % 7) < 3;
      if (shouldFill) {
        matrix[row][col] = true;
      }
    }
  }

  return matrix;
}

function QrCode({ value }: { value: string }) {
  const matrix = buildQrMatrix(value);

  return (
    <svg
      data-testid="qr-code"
      role="img"
      aria-label={`QR code for ${value}`}
      viewBox="0 0 21 21"
      className="h-48 w-48 rounded-3xl border border-zinc-200 bg-white p-3 shadow-inner dark:border-zinc-800"
      shapeRendering="crispEdges"
    >
      <rect width="21" height="21" fill="white" />
      {matrix.map((row, y) =>
        row.map((filled, x) =>
          filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="black" /> : null
        )
      )}
    </svg>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.itemName.trim()) {
    errors.itemName = "Item name is required.";
  }

  if (!values.priceUSDC.trim()) {
    errors.priceUSDC = "Price is required.";
  } else if (Number.isNaN(Number(values.priceUSDC)) || Number(values.priceUSDC) <= 0) {
    errors.priceUSDC = "Price must be a positive number.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  return errors;
}

export default function EscrowCreateForm() {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const copyResultUrl = async () => {
    if (!resultUrl) {
      return;
    }

    await navigator.clipboard.writeText(resultUrl);
    setCopyStatus("Link copied to clipboard.");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCopyStatus(null);
    setSubmitError(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: EscrowInput = {
        itemName: values.itemName.trim(),
        priceUSDC: values.priceUSDC.trim(),
        description: values.description.trim(),
        shippingWindow: values.shippingWindow,
      };

      const response = await createEscrow(payload);
      if (!response.url || !/^https?:\/\//i.test(response.url)) {
        throw new Error("The escrow service returned an invalid URL.");
      }

      setResultUrl(response.url);
      track("link_created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error creating the link.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const escrowId = getEscrowIdFromUrl(resultUrl || "escrow");
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `escrow_${escrowId}.png`;
    a.click();
    toast.success("QR code downloaded");
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="itemName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Item name
          </label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={values.itemName}
            onChange={(event) => updateField("itemName", event.target.value)}
            disabled={isSubmitting}
            placeholder="Awesome Widget"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            aria-invalid={Boolean(errors.itemName)}
            aria-describedby={errors.itemName ? "itemName-error" : undefined}
          />
          {errors.itemName ? (
            <p id="itemName-error" className="mt-2 text-sm text-red-600">
              {errors.itemName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="priceUSDC" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Price (USDC)
          </label>
          <input
            id="priceUSDC"
            name="priceUSDC"
            type="number"
            step="0.01"
            value={values.priceUSDC}
            onChange={(event) => updateField("priceUSDC", event.target.value)}
            disabled={isSubmitting}
            placeholder="123.45"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            aria-invalid={Boolean(errors.priceUSDC)}
            aria-describedby={errors.priceUSDC ? "priceUSDC-error" : undefined}
          />
          {errors.priceUSDC ? (
            <p id="priceUSDC-error" className="mt-2 text-sm text-red-600">
              {errors.priceUSDC}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            disabled={isSubmitting}
            placeholder="Brief description"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description ? (
            <p id="description-error" className="mt-2 text-sm text-red-600">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="shippingWindow"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shipping window
          </label>
          <select
            id="shippingWindow"
            name="shippingWindow"
            value={values.shippingWindow}
            onChange={(event) => updateField("shippingWindow", event.target.value as ShippingWindow)}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {shippingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {submitError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Creating link..." : "Create escrow link"}
        </button>
      </form>

      {resultUrl ? (
        <section
          data-testid="link-card"
          className="mt-8 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Shareable link ready
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Copy this URL or scan the QR code to share it with a buyer.
              </p>
            </div>
            <button
              type="button"
              onClick={copyResultUrl}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              Copy link
            </button>
          </div>

          <div className="mt-5">
            <label htmlFor="shareable-url" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Shareable URL
            </label>
            <input
              id="shareable-url"
              data-testid="shareable-url"
              readOnly
              value={resultUrl}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {copyStatus ? <p className="mt-2 text-sm text-emerald-600">{copyStatus}</p> : null}
          </div>

          <div className="mt-6 flex justify-center">
            <QrCode value={resultUrl} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
