/**
 * Internationalisation (i18n) configuration for TrustLink.
 *
 * Uses i18next together with `react-i18next` to provide translated strings
 * throughout the app. The instance is initialised lazily (guarded by
 * `i18n.isInitialized`) so it is safe to import this module in both the
 * browser and Node.js (e.g. during tests or SSR).
 *
 * Supported locales:
 *   - `en`  — English (default / fallback)
 *   - `fr`  — French
 *   - `pcm` — Nigerian Pidgin
 *
 * Usage:
 * ```tsx
 * import { useTranslation } from "react-i18next";
 * const { t } = useTranslation();
 * t("payment.title"); // → "Payment"
 * ```
 *
 * @module i18n
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      payment: {
        title: "Payment",
        status: "Payments are up to date and ready to process.",
        connectWallet: "Connect Wallet",
        submitPayment: "Submit Payment",
        submitting: "Processing...",
        confirmationTitle: "Payment Confirmed!",
        txHash: "Transaction Hash",
        viewTracking: "View Tracking",
        amount: "Amount",
        item: "Item",
        orderSummary: "Order Summary",
        escrowId: "Escrow ID",
        payFor: "Pay for {{item}}",
        orderNotFound: "Order Not Found",
        orderNotFoundDesc: "We couldn't find an escrow with ID:",
      },
      tracking: {
        title: "Track Your Order",
        orderId: "Order ID",
        orderDetails: "Order Details",
        item: "Item",
        amount: "Amount",
        status: "Status",
        shipmentStatus: "Shipment Status",
        orderPlaced: "Order Placed",
        orderPlacedDesc: "Your order has been created",
        paymentConfirmed: "Payment Confirmed",
        paymentConfirmedDesc: "Payment received and secured in escrow",
        shipped: "Shipped",
        shippedDesc: "Package is on its way",
        outForDelivery: "Out for Delivery",
        outForDeliveryDesc: "Package is out for final delivery",
        delivered: "Delivered",
        deliveredDesc: "Package has been delivered",
        confirmDelivery: "Confirm Delivery",
        confirming: "Confirming...",
        raiseDispute: "Raise a Dispute",
        disputeInProgress: "Dispute in Progress",
        disputeMessage:
          "A dispute has been raised for this order. Our team is reviewing the case and will resolve it shortly.",
        orderNotFound: "Order Not Found",
        orderNotFoundDesc: "We couldn't find an order with ID:",
      },
      nav: {
        dashboard: "Dashboard",
        createLink: "Create Link",
        trackOrder: "Track Order",
        profile: "Profile",
      },
      footer: {
        language: "Language",
        selectLanguage: "Select language",
        copyright: "TrustLink",
      },
      escrow: {
        errors: {
          itemNameRequired: "Item name is required.",
          itemNameTooLong: "Item name must be {{max}} characters or fewer.",
          priceRequired: "Price is required.",
          priceFormat:
            "Enter a positive amount in USDC using numbers only (for example 123.45).",
          priceTooSmall: "Price must be at least {{min}} USDC.",
          priceTooLarge: "Price must be {{max}} USDC or less.",
          descriptionRequired: "Description is required.",
          descriptionTooLong: "Description must be {{max}} characters or fewer.",
          shippingWindowInvalid: "Select a valid shipping window.",
        },
      },
    },
  },
  fr: {
    translation: {
      payment: {
        title: "Paiement",
        status: "Les paiements sont à jour et prêts à être traités.",
        connectWallet: "Connecter le portefeuille",
        submitPayment: "Soumettre le paiement",
        submitting: "Traitement en cours...",
        confirmationTitle: "Paiement confirmé !",
        txHash: "Hachage de transaction",
        viewTracking: "Voir le suivi",
        amount: "Montant",
        item: "Article",
        orderSummary: "Récapitulatif de la commande",
        escrowId: "ID de séquestre",
        payFor: "Payer pour {{item}}",
        orderNotFound: "Commande introuvable",
        orderNotFoundDesc: "Nous n'avons pas trouvé de séquestre avec l'ID :",
      },
      tracking: {
        title: "Suivre votre commande",
        orderId: "ID de commande",
        orderDetails: "Détails de la commande",
        item: "Article",
        amount: "Montant",
        status: "Statut",
        shipmentStatus: "Statut de l'expédition",
        orderPlaced: "Commande passée",
        orderPlacedDesc: "Votre commande a été créée",
        paymentConfirmed: "Paiement confirmé",
        paymentConfirmedDesc: "Paiement reçu et sécurisé en séquestre",
        shipped: "Expédié",
        shippedDesc: "Le colis est en route",
        outForDelivery: "En cours de livraison",
        outForDeliveryDesc: "Le colis est en cours de livraison finale",
        delivered: "Livré",
        deliveredDesc: "Le colis a été livré",
        confirmDelivery: "Confirmer la livraison",
        confirming: "Confirmation...",
        raiseDispute: "Soulever un litige",
        disputeInProgress: "Litige en cours",
        disputeMessage:
          "Un litige a été soulevé pour cette commande. Notre équipe examine le cas et le résoudra prochainement.",
        orderNotFound: "Commande introuvable",
        orderNotFoundDesc: "Nous n'avons pas trouvé de commande avec l'ID :",
      },
      nav: {
        dashboard: "Tableau de bord",
        createLink: "Créer un lien",
        trackOrder: "Suivre la commande",
        profile: "Profil",
      },
      footer: {
        language: "Langue",
        selectLanguage: "Choisir la langue",
        copyright: "TrustLink",
      },
      escrow: {
        errors: {
          itemNameRequired: "Le nom de l'article est requis.",
          itemNameTooLong:
            "Le nom de l'article doit contenir au maximum {{max}} caractères.",
          priceRequired: "Le prix est requis.",
          priceFormat:
            "Saisissez un montant positif en USDC, uniquement avec des chiffres (par exemple 123.45).",
          priceTooSmall: "Le prix doit être d'au moins {{min}} USDC.",
          priceTooLarge: "Le prix ne doit pas dépasser {{max}} USDC.",
          descriptionRequired: "La description est requise.",
          descriptionTooLong:
            "La description doit contenir au maximum {{max}} caractères.",
          shippingWindowInvalid: "Sélectionnez un délai de livraison valide.",
        },
      },
    },
  },
  pcm: {
    translation: {
      payment: {
        title: "Payment",
        status: "Payment don ready for process.",
        connectWallet: "Connect Wallet",
        submitPayment: "Submit Payment",
        submitting: "Processing...",
        confirmationTitle: "Payment Confirmed!",
        txHash: "Transaction Hash",
        viewTracking: "View Tracking",
        amount: "Amount",
        item: "Item",
        orderSummary: "Order Summary",
        escrowId: "Escrow ID",
        payFor: "Pay for {{item}}",
        orderNotFound: "Order No Find",
        orderNotFoundDesc: "We no see escrow with ID:",
      },
      tracking: {
        title: "Track Your Order",
        orderId: "Order ID",
        orderDetails: "Order Details",
        item: "Item",
        amount: "Amount",
        status: "Status",
        shipmentStatus: "Shipment Status",
        orderPlaced: "Order Placed",
        orderPlacedDesc: "Your order don create",
        paymentConfirmed: "Payment Confirmed",
        paymentConfirmedDesc: "Payment don receive and secure for escrow",
        shipped: "Shipped",
        shippedDesc: "Package dey come",
        outForDelivery: "Out for Delivery",
        outForDeliveryDesc: "Package dey come deliver",
        delivered: "Delivered",
        deliveredDesc: "Package don deliver",
        confirmDelivery: "Confirm Delivery",
        confirming: "Confirming...",
        raiseDispute: "Raise a Dispute",
        disputeInProgress: "Dispute in Progress",
        disputeMessage:
          "A dispute don raise for this order. Our team dey check am and go resolve am soon.",
        orderNotFound: "Order No Find",
        orderNotFoundDesc: "We no see order with ID:",
      },
      nav: {
        dashboard: "Dashboard",
        createLink: "Create Link",
        trackOrder: "Track Order",
        profile: "Profile",
      },
      footer: {
        language: "Language",
        selectLanguage: "Select language",
        copyright: "TrustLink",
      },
      escrow: {
        errors: {
          itemNameRequired: "E need the item name.",
          itemNameTooLong: "Item name no suppose pass {{max}} character.",
          priceRequired: "E need the price.",
          priceFormat:
            "Put positive amount for the USDC, number only (lek say 123.45).",
          priceTooSmall: "Price no suppose below {{min}} USDC.",
          priceTooLarge: "Price no suppose pass {{max}} USDC.",
          descriptionRequired: "E need the description.",
          descriptionTooLong: "Description no suppose pass {{max}} character.",
          shippingWindowInvalid: "Choose the correct shipping window.",
        },
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
