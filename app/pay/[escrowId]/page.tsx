import type { Metadata } from "next"

import { HowItWorks } from "@/components/payment/HowItWorks"
import { PAYMENT_FAQ_ITEMS } from "@/components/payment/paymentFaq"
import { Accordion, type AccordionItem } from "@/components/ui/Accordion"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { ApiError, getEscrow } from "@/lib/api"
import type { GetEscrowResponse } from "@/types/api"

import { PaymentEscrowClient } from "./PaymentEscrowClient"

interface PayPageProps {
	params: Promise<{ escrowId: string }>
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
	const { escrowId } = await params

	try {
		const escrow = await getEscrow(escrowId)
		const title = `Pay for ${escrow.item} | TrustLink`
		const description = `Secure escrow payment for ${escrow.item} — ${escrow.amount} USDC. Protected by TrustLink on the Stellar blockchain.`
		const images = escrow.imageUrl ? [{ url: escrow.imageUrl, alt: escrow.item }] : []

		return {
			title,
			description,
			openGraph: {
				title,
				description,
				type: "website",
				...(images.length > 0 && { images }),
			},
			twitter: {
				card: images.length > 0 ? "summary_large_image" : "summary",
				title,
				description,
				...(images.length > 0 && { images }),
			},
		}
	} catch {
		return {
			title: "Payment | TrustLink",
			description: "Secure escrow payment powered by TrustLink on the Stellar blockchain.",
		}
	}
}

export default async function PayPage({ params }: PayPageProps) {
	const { escrowId } = await params

	let escrow: GetEscrowResponse
	try {
		escrow = await getEscrow(escrowId)
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 404) throw error

		return (
			<div className="min-h-screen min-h-dvh bg-zinc-50 p-6 dark:bg-black">
				<div className="mx-auto max-w-4xl">
					<Breadcrumb
						items={[
							{ label: "Home", href: "/" },
							{ label: "Payment", href: "/payment" },
							{ label: "Error" },
						]}
						className="mb-4"
					/>
					<section className="rounded-3xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
						<h1 className="text-2xl font-semibold text-red-800 dark:text-red-200">Escrow Not Found</h1>
						<p className="mt-2 text-sm text-red-700 dark:text-red-300">
							We could not find an escrow with ID: <span className="font-mono">{escrowId}</span>
						</p>
					</section>
				</div>
			</div>
		)
	}

	const breadcrumbItems = [
		{ label: "Home", href: "/" },
		{ label: "Payment", href: "/payment" },
		{ label: `Escrow ${escrowId.slice(0, 8)}...` },
	]

	return (
		<div className="min-h-screen min-h-dvh bg-zinc-50 p-6 dark:bg-black">
			<div className="mx-auto max-w-4xl">
				<Breadcrumb items={breadcrumbItems} className="mb-4" />
				<PaymentEscrowClient escrow={escrow} escrowId={escrowId} />
				<HowItWorks />
				<section className="mt-8">
					<h2 className="mb-4 text-xl font-semibold text-zinc-950 dark:text-white">
						Frequently Asked Questions
					</h2>
					<Accordion items={PAYMENT_FAQ_ITEMS as AccordionItem[]} />
				</section>
			</div>
		</div>
	)
}
