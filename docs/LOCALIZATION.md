# Localization (i18n) Contribution Guide

> **Summary**: TrustLink uses `i18next` and `react-i18next` for internationalization. This guide establishes the required process for adding translation keys, preserving interpolation tokens, testing language switching, and avoiding the "silent fallback trap."

---

## Table of Contents

- [Supported Locales & Configuration](#supported-locales--configuration)
- [Key Structure & Namespaces](#key-structure--namespaces)
- [Interpolation Style & Token Parity](#interpolation-style--token-parity)
- [Language Detection & Persistence](#language-detection--persistence)
- [The "Silent Fallback Trap"](#the-silent-fallback-trap)
- [How to Add New Translation Keys](#how-to-add-new-translation-keys)
- [Testing Language Switching & Missing Keys](#testing-language-switching--missing-keys)
- [Related Translation Backlog](#related-translation-backlog)

---

## Supported Locales & Configuration

Localization configuration is centered in `lib/i18n.ts`. Translations are organized into per-locale JSON files:

| Locale Code | Language | Resource Path | Status |
| :--- | :--- | :--- | :--- |
| `en` | English | `locales/en/translation.json` | **Default / Fallback / Canonical** |
| `fr` | French | `locales/fr/translation.json` | Core flows translated |
| `pcm` | Nigerian Pidgin | `locales/pcm/translation.json` | Core flows translated |

All locales share a single default namespace (`translation`). The configuration initializes lazily with safe SSR guards and sets `fallbackLng: "en"`.

---

## Key Structure & Namespaces

Translation files are structured hierarchically using functional feature objects rather than flat keys. This matches our component boundaries and prevents key collisions.

### Existing Domain Namespaces:

- `dashboard`: Vendor escrow tables, bulk actions, search, analytics, and CSV exports.
- `common`: Reusable UI labels (loading states, buttons, dialog dismissals, reconnect prompts).
- `payment`: Buyer payment cards, fee breakdowns, token selectors, and wallet signing prompts.
- `tracking`: Order status timelines, shipment updates, and milestone verification.
- `dispute`: Dispute creation forms, evidence uploads, and reason selections.

### Example Key Nesting in `locales/en/translation.json`:

```json
{
  "dashboard": {
    "title": "Dashboard",
    "searchPlaceholder": "Search escrows...",
    "selectedCount": "{{count}} selected",
    "buyer": "Buyer: {{buyer}}",
    "emptyStateTitle": "No escrows yet",
    "metadata": {
      "pageTitle": "Dashboard | TrustLink"
    }
  }
}
```

### Usage in React Components:

```tsx
import { useTranslation } from "react-i18next";

export function EscrowSummary({ count, buyerAddress }: { count: number; buyerAddress: string }) {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.selectedCount", { count })}</p>
      <span>{t("dashboard.buyer", { buyer: buyerAddress })}</span>
    </div>
  );
}
```

---

## Interpolation Style & Token Parity

TrustLink uses standard `i18next` double curly braces `{{variableName}}` for string interpolation with `escapeValue: false`.

### Token Parity Rules:

1. **Exact Name & Casing**: Every interpolation token in the English source string must be preserved identically in translated files.
   - **Correct**:
     - English: `"Buyer: {{buyer}}"`
     - French: `"Acheteur : {{buyer}}"`
     - Pidgin: `"Buyer: {{buyer}}"`
   - **Incorrect**:
     - `"Acheteur : {{acheteur}}"` (broken token — will render blank)
     - `"Acheteur : {{Buyer}}"` (case mismatch)
2. **Count Variables**: For pluralization or counts, consistently name the token `{{count}}`:
   ```json
   "selectedCount": "{{count}} selected"
   ```
   ```json
   "selectedCount": "{{count}} sélectionné(s)"
   ```
3. **No HTML inside translated strings**: Avoid embedding raw HTML tags inside translation strings. Use structured text or component composition when formatting is required.

---

## Language Detection & Persistence

Language state is maintained and persisted automatically:

1. **Storage Key**: `trustlink.language` in `window.localStorage`.
2. **Detection Precedence**:
   1. `window.localStorage.getItem("trustlink.language")` (if matching `en`, `fr`, or `pcm`).
   2. Browser locale: `navigator.language.split("-")[0]`.
   3. Fallback: `"en"`.
3. **Automatic Persistence**: When `i18n.changeLanguage(locale)` is invoked, `lib/i18n.ts` listens to the `languageChanged` event and saves the new locale to `window.localStorage`.

---

## The "Silent Fallback Trap"

> ⚠️ **Important Concept for Contributors**:
> Because `fallbackLng: "en"` is configured in `lib/i18n.ts`, **missing translation keys will silently fall back to English without throwing errors or breaking the UI.**

### Why this matters:
- If you add a new feature with new English keys in `locales/en/translation.json`, and then switch your browser to French (`fr`), **the page will still render completely and look fine**.
- The missing French strings will render in English, masking the fact that `locales/fr/translation.json` is missing those entries.
- **Visual testing alone in a non-English locale is not sufficient to confirm that translations are in place.**

---

## How to Add New Translation Keys

When adding or modifying user-facing text, follow this strict checklist:

1. **Add to English first**: Add the new key to `locales/en/translation.json` under the appropriate domain object.
2. **Add matching keys to other locales**: Add corresponding keys to `locales/fr/translation.json` and `locales/pcm/translation.json`.
   - If professional French or Nigerian Pidgin translations are not immediately available for your PR, add the key with the English string or mark it clearly for follow-up translation, ensuring the JSON key structure and tokens remain 100% identical.
3. **Verify token parity**: Double-check that all tokens (e.g. `{{item}}`, `{{count}}`, `{{time}}`) exist in all three files with matching names.
4. **Alphabetical & Clean JSON**: Ensure JSON is valid, properly indented (2 spaces), and has no trailing commas.

---

## Testing Language Switching & Missing Keys

Contributors should verify internationalization using these local testing methods:

### 1. Programmatic Switching in Browser DevTools
Open browser DevTools Console (`F12`) on `http://localhost:3000`:

```javascript
// Test French
localStorage.setItem("trustlink.language", "fr");
location.reload();

// Test Nigerian Pidgin
localStorage.setItem("trustlink.language", "pcm");
location.reload();

// Reset to English
localStorage.setItem("trustlink.language", "en");
location.reload();
```

### 2. Auditing Key Parity via Script
To confirm that `locales/fr/translation.json` and `locales/pcm/translation.json` contain all keys present in `locales/en/translation.json`, you can run a quick Node.js parity check in your terminal:

```bash
node -e '
const en = require("./locales/en/translation.json");
const fr = require("./locales/fr/translation.json");
const pcm = require("./locales/pcm/translation.json");

function getKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? getKeys(v, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

const enKeys = new Set(getKeys(en));
const frKeys = new Set(getKeys(fr));
const pcmKeys = new Set(getKeys(pcm));

const missingFr = [...enKeys].filter(k => !frKeys.has(k));
const missingPcm = [...enKeys].filter(k => !pcmKeys.has(k));

console.log("Missing in FR:", missingFr.length, missingFr);
console.log("Missing in PCM:", missingPcm.length, missingPcm);
'
```

### 3. Diagnostic Mode for Missing Keys
When adding extensive new screens, you can temporarily enable missing key logging in `lib/i18n.ts`:

```typescript
// For local diagnostic debugging only (do not commit):
i18n.use(initReactI18next).init({
  resources,
  lng: detectedLang,
  fallbackLng: false, // Disables fallback to highlight missing keys immediately
  debug: true,         // Logs missing keys to browser console
  ...
});
```

---

## Related Translation Backlog

The following backlog tasks track language coverage across existing modules:
- **French Coverage**: Completing French strings for existing application keys is tracked under separate issue work (Issue #058).
- **Nigerian Pidgin Coverage**: Completing Nigerian Pidgin translations is tracked under separate issue work (Issue #059).
- **Language Switcher UI**: Comprehensive preference persistence and switcher controls are tracked under Issue #076.
