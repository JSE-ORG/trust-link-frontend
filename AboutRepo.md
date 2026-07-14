Frontend Repository: `trustlink-frontend`
* **Role in Architecture:** The Client Application (The "Shopfront")
* **Key Language & Tech:** Next.js (App Router), TypeScript, Tailwind CSS, ShadcnUI, Freighter SDK

### 🔍 Deep Technical Overview
A mobile-first, high-performance web dashboard built to provide a Web2-level consumer experience over Web3 rails. It lets social media vendors generate reusable or unique secure links, and allows everyday buyers to review terms, lock funds, and manage incoming deliveries securely.

### ⚙️ Core User Interface Features
* **Dynamic Link Builder:** Form inputs with real-time field validation (Item price, shipping estimates, terms) that export clean, shareable transaction paths (e.g., `trustlink.app/pay/escrow_id`).
* **Web3 Wallet Interface:** Fully integrated connect/disconnect wallet flows utilizing the **Stellar Freighter SDK** and Passkey-based wallets for onboarding Web2-native buyers easily.
* **Escrow Progress Monitor:** Real-time visual progress tracks showing interactive timeline maps of funds traveling from locked state through shipping transit right to vendor payout.
* **Resolution Portal:** Dedicated user flow for buyers to upload physical item photos, state grievances, and formally initiate on-chain disputes.