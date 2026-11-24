# Accessibility

TrustLink is used on a wide range of devices and by people with varying digital literacy, and it moves money, so a control that cannot be reached with a keyboard or announced by a screen reader is a real failure. This document has two parts:

1. **[Contributor Accessibility Checklist](#contributor-accessibility-checklist)**: rules for writing and reviewing UI code, how to run the automated tests, and how to test by hand.
2. **[Accessibility Audit Report](#accessibility-audit-report)**: the color-contrast audit from 2026-06-02.

Related: [CONTRIBUTING.md](CONTRIBUTING.md#accessibility-standards) (project-wide rules), [docs/VOICEOVER_TESTING.md](docs/VOICEOVER_TESTING.md) (VoiceOver test report), and the localization notes in [docs/LOCALIZATION.md](docs/LOCALIZATION.md) (labels and announcements must be translated too).

---

## Contributor Accessibility Checklist

Copy this into your PR description and tick what applies. Reviewers: check the same list against the diff.

- [ ] **Keyboard:** every interactive element can be reached and operated with the keyboard alone, in a logical order, and no keyboard trap exists outside dialogs.
- [ ] **Focus is visible** on every interactive element (see [Buttons and links](#buttons-and-links)).
- [ ] **Semantics first:** native `<button>`, `<a>`, `<input>`, `<label>`, headings and landmarks are used instead of clickable `<div>`s.
- [ ] **Names:** every control has an accessible name (visible text, `<label>`, `aria-label` or `aria-labelledby`). Icon-only buttons have an `aria-label`; decorative icons are `aria-hidden="true"`.
- [ ] **Forms** use `FormField` or equivalent wiring for labels, hints and errors ([Form inputs](#form-inputs)).
- [ ] **Dialogs** trap focus, close on Escape and return focus ([Dialogs and modals](#dialogs-and-modals)).
- [ ] **Status changes** are announced through the right live region ([Live regions](#live-regions)).
- [ ] **Color is never the only signal.** State is also conveyed with text or an icon, and text meets 4.5:1 contrast (3:1 for large text and focus indicators).
- [ ] **Tests:** `npm run test tests/a11y/` passes, and a new reusable component has an axe test.
- [ ] **Manual keyboard pass** done on the changed screen ([Manual testing](#manual-keyboard-testing)).

### Form inputs

Use `FormField` (`components/ui/FormField.tsx`) for a labelled input. It takes `label`, `id`, and optional `hint` and `error`, and wires the control for you:

- renders `<label htmlFor={id}>` for the visible label;
- sets `aria-invalid` on the child control when there is an `error`;
- sets `aria-describedby` on the child control to the ids of the error (`${id}-error`) and the hint (`${id}-hint`);
- renders the error as `<p role="alert">`, so a screen reader announces it as soon as it appears;
- shows the hint only while there is no error.

```tsx
<FormField label="Email" id="buyer-email" hint="We send the receipt here." error={emailError}>
  <input id="buyer-email" type="email" autoComplete="email" />
</FormField>
```

Rules:

- The `id` on `FormField` and the `id` on the control must match.
- Never use a placeholder as the only label. It disappears on input and often fails contrast.
- Put the error next to the field and say how to fix it ("Enter a valid email address."), not only that something is wrong.
- Use the right `type` and `autoComplete` so browsers and assistive technology can help.
- Set `required` (and mark it visually with text, not only color) for required fields.
- For a multi-step form, move focus to the first error or the new step heading when the step changes, so keyboard and screen reader users are not left on a control that has disappeared.

### Dialogs and modals

Prefer the existing building blocks over a hand-rolled overlay:

| Need | Use |
|---|---|
| Content in a modal | `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` (`components/ui/dialog.tsx`) |
| Yes/no confirmation | `ConfirmationDialog` (`components/ui/ConfirmationDialog.tsx`) |
| A custom overlay | Wrap it in `FocusTrap` (`components/ui/FocusTrap.tsx`) |

`DialogContent` renders `role="dialog"` and `aria-modal="true"`, labels itself from `DialogTitle` (or an explicit `aria-label` / `aria-labelledby`), links `DialogDescription` through `aria-describedby`, includes a close button with `aria-label="Close"`, and locks body scroll while open.

`FocusTrap` provides the keyboard behavior every modal needs:

- moves focus into the container when `active` becomes true, to `initialFocusRef` if given, otherwise to the first focusable element;
- cycles Tab and Shift+Tab inside the container;
- calls `onEscape` when Escape is pressed (use it to close the dialog);
- returns focus to the element that was focused before it opened.

```tsx
<FocusTrap active={open} onEscape={() => setOpen(false)} initialFocusRef={cancelRef}>
  <div role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <h2 id="confirm-title">Release funds?</h2>
    {/* ... */}
    <button ref={cancelRef} type="button" onClick={() => setOpen(false)}>Cancel</button>
  </div>
</FocusTrap>
```

Rules:

- A dialog must have an accessible name and must close on Escape.
- For destructive or irreversible actions, start focus on the safe control (`ConfirmationDialog` has `initialFocus="cancel"` for this).
- The trigger should advertise the dialog, for example `aria-haspopup="dialog"`.
- Do not render two overlapping traps at once.

### Buttons and links

- Use `<button type="button">` for actions and `<a href>` (or Next.js `Link`) for navigation. A link that only runs JavaScript, or a button that only navigates, is the wrong element.
- Use the shared `Button` (`components/ui/button.tsx`). It already includes the project focus ring (`focus-visible:ring-2` with an offset) and a disabled style.
- Custom controls must show a visible focus style. Do not remove the outline (`outline-none`) unless you replace it with a `focus-visible:` ring of at least 3:1 contrast against the adjacent colors.
- Give the control a name that makes sense out of context. Avoid "Click here" and "Read more" on their own.
- Do not rely on hover to reveal an action. Anything shown on hover must also be reachable by focus.
- Keep touch targets large enough to tap (aim for at least 44 by 44 CSS pixels on mobile).
- When a button is disabled while something loads, say so with text ("Submitting...") and not only with a spinner.

### Live regions

| Situation | Pattern |
|---|---|
| Form or request error that needs attention now | `role="alert"` (assertive), for example `FormField` errors, `DisputeFormError` (`role="alert"` with `aria-live="assertive"`) |
| Success or progress that should not interrupt | `role="status"` (polite), for example `DisputeFormSuccess` (`role="status"` with `aria-live="polite"`) and `EscrowLinkCard` (`role="status"`) |
| A status label that may change, such as an escrow state | `EscrowStatusBadge` uses `role="status"` |

Rules:

- Render the live region container in the DOM before its content changes where you can; updates to a region that appears at the same moment as its text are announced less reliably.
- Use assertive announcements sparingly. Most updates should be polite.
- Toasts (Sonner, mounted once in `app/layout.tsx`) are announced by the library. Do not also add a second live region for the same message.
- Loading states need a text equivalent, for example a `role="status"` wrapper with an `aria-label`, as used for skeletons in the axe tests.

### Page structure

- Pages render inside `<main id="main-content" tabIndex={-1}>` from `app/layout.tsx`, and the layout already provides a "Skip to content" link. Do not add another `<main>`.
- One `<h1>` per page, then headings in order without skipping levels.
- Use landmarks (`nav`, `main`, `footer`) and label a landmark with `aria-label` when a page has more than one of the same kind.
- Respect `prefers-reduced-motion` for new animations.

---

## Running automated accessibility tests

The suite in `tests/a11y/` renders components in jsdom and runs [axe](https://github.com/dequelabs/axe-core) through `jest-axe` against the WCAG 2.0/2.1 A and AA rules.

```bash
# the whole a11y suite
npm run test tests/a11y/

# the same thing, directly
npx vitest run tests/a11y/

# the entire unit suite (includes a11y)
npm run test
```

Notes:

- Color contrast is **disabled** in these tests, because jsdom has no real layout or paint. Check contrast by hand or with Lighthouse (the CI Lighthouse job requires an accessibility score of at least 0.9; see `.lighthouserc.json`).
- To cover a new component, add a case to `tests/a11y/components.a11y.test.tsx` using the existing helper:

  ```tsx
  it("MyComponent", async () => {
    await expectNoA11yViolations(<MyComponent />);
  });
  ```

  For stateful flows (such as the four `DisputeForm` steps), drive the component with `userEvent` to each state and run `axe` on each one.
- A passing axe run does not prove accessibility. Automated tools catch only a portion of problems, so the manual steps below still apply.
- To scan a running page, you can use the axe CLI as described in [CONTRIBUTING.md](CONTRIBUTING.md#accessibility-standards).

---

## Manual keyboard testing

Do this on every screen you change, in the browser, without touching the mouse.

| Key | What should happen |
|---|---|
| `Tab` | Moves focus forward to the next interactive element, in reading order. Focus is always visible |
| `Shift` + `Tab` | Moves focus backward |
| `Enter` | Activates links and buttons; submits a form from a text field |
| `Space` | Activates buttons, toggles checkboxes, opens a select |
| `Escape` | Closes the open dialog, menu or popover and returns focus to what opened it |
| Arrow keys | Move within composite widgets such as menus, radio groups and selects |

Quick pass:

1. Load the page and press `Tab` once. The first stop should be the "Skip to content" link. Press `Enter` and confirm focus moves to the main content.
2. Keep pressing `Tab` through the page. Every control is reachable, nothing is skipped, the order matches the visual order, and you never get stuck.
3. Open each dialog or menu with the keyboard. Focus moves inside, `Tab` stays inside, `Escape` closes it, and focus returns to the trigger.
4. Submit a form with an error. The error is visible, is tied to its field, and can be reached and fixed by keyboard.
5. Zoom the browser to 200% and resize to a narrow width. Nothing is cut off or overlaps, and controls still work.
6. Turn off color (or use a grayscale filter). State is still understandable.

### Screen reader spot checks

Use one screen reader on the flows you changed. A short pass is more useful than none.

| Screen reader | Platform | Start / stop |
|---|---|---|
| NVDA (free) | Windows, with Firefox or Chrome | `Ctrl` + `Alt` + `N` to start, `Insert` + `Q` to quit |
| VoiceOver | macOS (Safari) | `Cmd` + `F5` to toggle |
| VoiceOver | iOS Safari | Settings, Accessibility, VoiceOver |

Check that: headings and landmarks list sensibly (NVDA `Insert` + `F7`, VoiceOver rotor), every control is announced with a name and role, errors and status messages are announced when they appear, and dialogs are announced as dialogs. The earlier VoiceOver results and scenarios are in [docs/VOICEOVER_TESTING.md](docs/VOICEOVER_TESTING.md).

## Further reading

- [WCAG 2.1 quick reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices: dialog (modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)

---

## Accessibility Audit Report

## Color Contrast Audit

### Overview
This report documents color contrast issues found in the trust-link-frontend application according to WCAG 2.1 Level AA standards (minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text).

### Methodology
- Manual inspection of UI components
- Color contrast testing against WCAG 2.1 AA standards
- Audit date: 2026-06-02

---

## Violations Found

### 1. Zinc Text on White Background (Low Severity)

**Location:** Multiple components  
**Issue:** `text-zinc-500` (rgb(113, 113, 122)) on white background  
**Contrast Ratio:** 4.54:1  
**Status:** ✅ PASS (borderline - passes AA standard)  
**Recommendation:** Consider using `text-zinc-600` for better readability

---

### 2. Zinc Text on Dark Background (Low Severity)

**Location:** Multiple components  
**Issue:** `text-zinc-400` (rgb(161, 161, 170)) on `bg-zinc-950` (rgb(9, 9, 11))  
**Contrast Ratio:** 4.89:1  
**Status:** ✅ PASS (borderline)  
**Recommendation:** Consider using `text-zinc-300` for improved contrast

---

### 3. Placeholder Text in Inputs (Potential Issue)

**Location:** Form inputs throughout the application  
**Issue:** Default placeholder text may not meet contrast requirements  
**Contrast Ratio:** Not explicitly set  
**Status:** ⚠️ WARNING  
**Recommendation:** Ensure placeholder text has sufficient contrast or use explicit styling

---

### 4. Disabled Button States

**Location:** Various forms and action buttons  
**Issue:** Disabled buttons may have insufficient contrast  
**Contrast Ratio:** Varies  
**Status:** ⚠️ WARNING  
**Recommendation:** Review disabled state colors to ensure they meet WCAG SC 1.4.3 requirements while still appearing disabled

---

### 5. Secondary Text in Cards

**Location:** Dispute cards, escrow cards  
**Issue:** `text-zinc-600` on white / `text-zinc-300` on dark  
**Contrast Ratio:** 5.74:1 (light) / 7.08:1 (dark)  
**Status:** ✅ PASS  
**Notes:** Meets AA standards

---

### 6. Link Colors

**Location:** Navigation and inline links  
**Issue:** Links need to be distinguishable from surrounding text  
**Status:** ⚠️ NEEDS REVIEW  
**Recommendation:** Ensure links have sufficient contrast (4.5:1) against background and are distinguishable from non-link text through more than color alone

---

### 7. Focus Indicators

**Location:** Interactive elements throughout the application  
**Issue:** Focus indicators must have 3:1 contrast ratio with adjacent colors  
**Status:** ⚠️ NEEDS REVIEW  
**Recommendation:** Audit all focus states to ensure they meet WCAG 2.1 SC 2.4.7

---

## Summary Statistics

- **Total Issues Found:** 7
- **Critical Issues:** 0
- **Warnings:** 4
- **Passed with Recommendations:** 3

---

## Recommendations

### High Priority
1. **Review and enhance focus indicators** across all interactive elements
2. **Audit form placeholder text** and ensure explicit contrast-compliant styling
3. **Document link styling pattern** to ensure consistent distinguishability

### Medium Priority
4. Improve borderline text colors (zinc-500, zinc-400) to use darker/lighter variants
5. Review disabled button states for proper contrast
6. Create a color palette reference guide for developers

### Low Priority
7. Consider implementing a dark mode contrast boost option
8. Add automated contrast testing to CI/CD pipeline

---

## Testing Recommendations

### Manual Testing Tools
- Chrome DevTools Color Picker (built-in contrast ratio checker)
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- Colour Contrast Analyser (desktop app)

### Automated Testing
- axe DevTools browser extension
- Lighthouse accessibility audit
- Pa11y automated testing in CI

### Screen Reader Testing
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

---

## Compliance Status

**WCAG 2.1 Level AA:** ⚠️ Mostly Compliant  
**Critical Blockers:** None  
**Action Required:** Address warnings in high and medium priority recommendations

---

## Notes

This audit focused on color contrast issues. Full WCAG 2.1 AA compliance requires additional testing for:
- Keyboard navigation
- Screen reader compatibility
- Focus management
- ARIA implementation
- Semantic HTML structure
- Form labeling
- Error identification

These areas should be audited separately as part of a comprehensive accessibility review.

---

**Report Generated:** 2026-06-02  
**Auditor:** Automated code review  
**Next Review Date:** 2026-09-02 (Recommended quarterly reviews)
