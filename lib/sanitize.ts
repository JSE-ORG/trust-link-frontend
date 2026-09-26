/**
 * Centralised sanitisation helpers for user-provided text.
 *
 * React escapes text rendered as `{value}` by default, but several code paths
 * in this app move user content *outside* of that protection:
 *   - exported CSV files (spreadsheet formula injection),
 *   - image/link URLs passed straight to `src`/`href`,
 *   - any string later handed to PDF/canvas renderers.
 *
 * These helpers give every one of those paths a single, well-tested place to
 * neutralise XSS and injection attempts before the value leaves the app.
 */

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/gi;
// `<script>`/`<style>` blocks whose *contents* must be dropped, not just the tags.
const SCRIPT_STYLE_RE = /<(script|style)\b[\s\S]*?<\/\1>/gi;
// Control characters except tab (\x09), newline (\x0A) and carriage return (\x0D).
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// Every control character (incl. tab/newline/CR). Browsers strip these from URLs
// before resolving the scheme, so they must be removed before the safety check.
const URL_CONTROL_RE = /[\x00-\x1F\x7F]/g;

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

/**
 * Escape the characters that have special meaning in HTML so the value can be
 * safely interpolated into raw markup.
 */
export function escapeHtml(input: unknown): string {
  return String(input ?? "").replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Remove HTML tags from a string, leaving the visible text intact.
 */
export function stripHtml(input: unknown): string {
  return String(input ?? "").replace(HTML_TAG_RE, "");
}

/**
 * General-purpose plain-text sanitiser: strips HTML tags, removes control
 * characters, collapses runs of whitespace and trims. Use this for any
 * free-text field (item names, descriptions, messages) before persisting,
 * exporting or rendering it in a non-React context.
 */
export function sanitizeText(input: unknown): string {
  const withoutScriptBlocks = String(input ?? "").replace(SCRIPT_STYLE_RE, "");
  return stripHtml(withoutScriptBlocks)
    .replace(CONTROL_CHARS_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Validate a user-supplied URL and return it only when it uses a safe
 * protocol. Blocks `javascript:`, `data:`, `vbscript:` and other vectors that
 * can execute script when placed in an `href` or `src`. Relative URLs (paths,
 * query strings, fragments) are allowed. Returns `fallback` when the value is
 * unsafe or cannot be parsed.
 */
export function sanitizeUrl(input: unknown, fallback = ""): string {
  const raw = String(input ?? "").trim();
  if (raw === "") return fallback;

  // Strip control characters (incl. tab/newline/CR) that smuggle a scheme past
  // the check, e.g. "java\tscript:alert(1)" which browsers read as "javascript:".
  const normalised = raw.replace(URL_CONTROL_RE, "");

  // Relative URLs have no scheme and are safe to keep as-is.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(normalised);
  if (!hasScheme) return normalised;

  try {
    const parsed = new URL(normalised, "http://localhost");
    return SAFE_URL_PROTOCOLS.has(parsed.protocol) ? normalised : fallback;
  } catch {
    return fallback;
  }
}

const CSV_INJECTION_RE = /^[=+\-@\t\r]/;

/**
 * Neutralise spreadsheet formula injection. A CSV cell that begins with
 * `=`, `+`, `-`, `@`, tab or carriage return is interpreted as a formula by
 * Excel/Sheets/LibreOffice and can exfiltrate data or run commands. Prefixing
 * such values with a single quote forces them to be treated as plain text.
 */
export function sanitizeCsvCell(input: unknown): string {
  const str = String(input ?? "");
  return CSV_INJECTION_RE.test(str) ? `'${str}` : str;
}
