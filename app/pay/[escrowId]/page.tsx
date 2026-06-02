import { getEscrow } from "@/lib/api"
import { PaymentEscrowClient } from "./PaymentEscrowClient"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { Accordion } from "@/components/ui/Accordion"

interface PayPageProps {
	params: Promise<{ escrowId: string }>
}

const faqItems = [
	{
		question: "How does escrow protect my payment?",
		answer:
			"Your funds are held in a smart contract on the Stellar blockchain until the transaction is completed. Neither party can access the funds unilaterally, ensuring both buyer and seller are protected.",
	},
	{
		question: "What happens if there's a dispute?",
		answer:
			"If a dispute arises, our resolution process is triggered. The escrow funds remain locked in the smart contract while both parties submit evidence. A resolution is reached based on the terms agreed upon at the start.",
	},
	{
		question: "Are there any platform fees?",
		answer:
			"A small platform fee of 1.5% is charged on each transaction to maintain the infrastructure and support dispute resolution. This fee is clearly displayed before you confirm payment.",
	},
	{
		question: "How long does the escrow process take?",
		answer:
			"Once payment is confirmed on the Stellar network (typically 3-5 seconds), the escrow is active. Funds are released to the seller once the buyer confirms receipt of goods or services.",
	},
]

export default async function PayPage({ params }: PayPageProps) {
	const { escrowId } = await params

	try {
		const escrow = await getEscrow(escrowId)
		const breadcrumbItems = [
			{ label: "Home", href: "/" },
			{ label: "Payment", href: "/payment" },
			{ label: `Escrow ${escrowId.slice(0, 8)}...` },
		]

		return (
			<main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
				<div className="mx-auto max-w-4xl">
					<Breadcrumb items={breadcrumbItems} className="mb-4" />
					<PaymentEscrowClient escrow={escrow} escrowId={escrowId} />
					<section className="mt-8">
						<h2 className="mb-4 text-xl font-semibold text-zinc-950 dark:text-white">
							Frequently Asked Questions
						</h2>
						<Accordion items={faqItems} />
					</section>
				</div>
			</main>
		)
	} catch {
		return (
			<main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
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
			</main>
		)
	}
}
