
export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown
    // Escape HTML first to prevent injection
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    
    // Italic: *text* or _text_ (but not inside words)
    .replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, "<em>$1</em>")
    .replace(/\b_([^_\s](?:[^_]*[^_\s])?)_\b/g, "<em>$1</em>")
    
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      // Sanitize URL
      const cleanUrl = sanitizeMarkdownUrl(url);
      if (!cleanUrl) return text;
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline dark:text-blue-400">${text}</a>`;
    })
    
    // Unordered lists: lines starting with * or -
    .replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>")
    
    // Line breaks
    .replace(/\n/g, "<br>");
  
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(<br>)?(?=<li>|$)/g, "$1");
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, "<ul class=\"list-disc list-inside space-y-1\">$&</ul>");
  
  return html;
}

/**
 * Sanitizes URLs in markdown links.
 * Only allows http:, https:, and mailto: protocols.
 */
function sanitizeMarkdownUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  
  // Remove control characters
  const cleaned = trimmed.replace(/[\x00-\x1F\x7F]/g, "");
  
  // Check for safe protocols
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(cleaned);
  if (!hasProtocol) {
    // Relative URLs are allowed
    return cleaned;
  }
  
  try {
    const parsed = new URL(cleaned, "http://localhost");
    const safeProtocols = ["http:", "https:", "mailto:"];
    if (safeProtocols.includes(parsed.protocol)) {
      return cleaned;
    }
  } catch {
    // Invalid URL
  }
  
  return "";
}

/**
 * Renders markdown as safe HTML in React components.
 * Use with dangerouslySetInnerHTML.
 */
export function renderMarkdown(markdown: string): { __html: string } {
  return { __html: parseMarkdown(markdown) };
}
