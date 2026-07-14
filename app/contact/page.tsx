import Link from "next/link";

export const metadata = {
  title: "Contact | TrustLink",
  description: "Get in touch with the TrustLink team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          &larr; Back to Home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-zinc-950 dark:text-white">Contact Us</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Reach out to the team at{" "}
          <a href="mailto:support@trustlink.example" className="text-accent hover:underline">
            support@trustlink.example
          </a>
          .
        </p>
      </div>
    </main>
  );
}
