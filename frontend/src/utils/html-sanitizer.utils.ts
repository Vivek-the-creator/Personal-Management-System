export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const allowedTags = new Set([
    "B", "STRONG", "I", "EM", "U", "H1", "H2", "H3", "H4", "H5", "H6",
    "P", "UL", "OL", "LI", "BLOCKQUOTE", "A", "BR", "SPAN", "DIV", "CODE", "PRE"
  ]);

  function cleanNode(node: Node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;

        if (!allowedTags.has(el.tagName)) {
          // Replace non-allowed tag with its text content
          const textNode = doc.createTextNode(el.textContent || "");
          node.replaceChild(textNode, el);
          continue;
        }

        // Clean attributes (only allow safe href for A tag)
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name === "style") {
            el.removeAttribute(attr.name);
          } else if (el.tagName === "A" && name === "href") {
            const val = attr.value.trim().toLowerCase();
            if (val.startsWith("javascript:") || val.startsWith("data:")) {
              el.removeAttribute("href");
            } else {
              el.setAttribute("target", "_blank");
              el.setAttribute("rel", "noopener noreferrer");
            }
          } else if (el.tagName !== "A" || name !== "href") {
            el.removeAttribute(attr.name);
          }
        }

        cleanNode(el);
      }
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

export function extractPlainTextSnippet(html: string, maxLength = 100): string {
  if (!html) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>?/gm, "").slice(0, maxLength);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const text = doc.body.textContent || "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength)}…`;
}
