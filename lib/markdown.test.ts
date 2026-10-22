import { describe, expect, it } from "vitest";

import { parseMarkdown, renderMarkdown } from "@/lib/markdown";

function parseIntoElement(markdown: string) {
  const element = document.createElement("div");
  element.innerHTML = parseMarkdown(markdown);
  return element;
}

describe("parseMarkdown", () => {
  it("escapes raw HTML and quotes before applying inline formatting", () => {
    const html = parseMarkdown(`<script>alert("x")</script> & '<img src=x onerror=evil>' **safe**`);

    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&amp; &#39;&lt;img src=x onerror=evil&gt;&#39;");
    expect(html).toContain("<strong>safe</strong>");
    const element = parseIntoElement(`<img src=x onerror=evil> **safe**`);
    expect(element.querySelector("img")).toBeNull();
    expect(element.querySelector("strong")?.textContent).toBe("safe");
  });

  it("supports both emphasis styles and mixed formatting inside links", () => {
    const element = parseIntoElement("**bold** __also bold__ *italic* _also italic_ [**Docs** and *help*](https://example.com)");

    expect(Array.from(element.querySelectorAll("strong"), (node) => node.textContent)).toEqual([
      "bold", "also bold", "Docs",
    ]);
    expect(Array.from(element.querySelectorAll("em"), (node) => node.textContent)).toEqual([
      "italic", "also italic", "help",
    ]);
    expect(element.querySelector("a strong")?.textContent).toBe("Docs");
    expect(parseMarkdown("some_word_here")).toBe("some_word_here");
  });

  it("groups adjacent list items and preserves inline formatting and line breaks", () => {
    const element = parseIntoElement("- **First**\n- [Second](/orders)\nAfter\nNext");

    expect(element.querySelectorAll("ul")).toHaveLength(1);
    expect(Array.from(element.querySelectorAll("ul > li"), (node) => node.textContent)).toEqual([
      "First", "Second",
    ]);
    expect(element.querySelector("li strong")?.textContent).toBe("First");
    expect(element.querySelector("li a")?.getAttribute("href")).toBe("/orders");
    expect(element.innerHTML).toContain("After<br>Next");
    expect(parseIntoElement("* Item").querySelector("ul > li")?.textContent).toBe("Item");
  });

  it.each([
    ["https://example.com/path", "https://example.com/path"],
    ["http://example.com", "http://example.com"],
    ["mailto:vendor@example.com", "mailto:vendor@example.com"],
    ["/orders/one", "/orders/one"],
    ["../orders", "../orders"],
    ["?page=2#orders", "?page=2#orders"],
    ["#details", "#details"],
    ["//example.com/path", "//example.com/path"],
    ["  https://example.com  ", "https://example.com"],
    ["https://exa\tmple.com", "https://example.com"],
  ])("retains allowed URL %j with safe link attributes", (url, expected) => {
    const link = parseIntoElement(`[Open](${url})`).querySelector("a");

    expect(link?.getAttribute("href")).toBe(expected);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.textContent).toBe("Open");
  });

  it.each([
    "javascript:evil", "JaVaScRiPt:evil", "data:text/html,evil",
    "vbscript:evil", "file:///etc/passwd", "ftp://example.com",
    "java\tscript:evil", "java\r\nscript:evil", "java\u0000script:evil",
    "java\u007fscript:evil", "https://", "   ",
  ])("removes the anchor for blocked URL %j while retaining its label", (url) => {
    const element = parseIntoElement(`[**Visible**](${url})`);

    expect(element.querySelector("a")).toBeNull();
    expect(element.querySelector("strong")?.textContent).toBe("Visible");
    expect(element.textContent).toBe("Visible");
  });

  it("keeps quotes and ampersands inside the URL attribute", () => {
    const element = parseIntoElement(`[Open](https://example.com/?q=" onmouseover="evil&x='value')`);
    const link = element.querySelector("a");

    expect(element.querySelectorAll("a")).toHaveLength(1);
    expect(link?.getAttribute("href")).toBe(`https://example.com/?q=" onmouseover="evil&x='value'`);
    expect(link?.hasAttribute("onmouseover")).toBe(false);
  });
});

describe("renderMarkdown", () => {
  it("returns an empty React inner-HTML object for empty input", () => {
    expect(parseMarkdown("")).toBe("");
    expect(renderMarkdown("")).toEqual({ __html: "" });
  });

  it("composes formatting and URL safety into the React inner-HTML shape", () => {
    const input = '<b>raw</b> **bold** [blocked](javascript:evil)\n[Safe](/orders)';
    const result = renderMarkdown(input);

    expect(result).toEqual({ __html: parseMarkdown(input) });
    expect(result.__html).toContain("&lt;b&gt;raw&lt;/b&gt; <strong>bold</strong> blocked<br>");
    expect(result.__html).toContain('href="/orders"');
    expect(result.__html).not.toContain("javascript:");
  });
});
