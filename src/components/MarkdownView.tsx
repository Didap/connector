function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
  return out;
}

export function MarkdownView({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const parts: string[] = [];
  let inList = false;
  let inCode = false;
  let codeBuf: string[] = [];

  const flushList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };
  const flushCode = () => {
    if (inCode) {
      parts.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
      codeBuf = [];
      inCode = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) flushCode();
      else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)![0].length;
      parts.push(`<h${level}>${renderInline(line.replace(/^#+\s/, ""))}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushList();
      parts.push("<hr/>");
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      flushList();
      parts.push("");
      continue;
    }
    flushList();
    parts.push(`<p>${renderInline(line)}</p>`);
  }
  flushCode();
  flushList();

  return (
    <div
      className="markdown-body text-sm"
      dangerouslySetInnerHTML={{ __html: parts.join("\n") }}
    />
  );
}
