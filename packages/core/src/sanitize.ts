function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)*]+)\)/gi,
      (_match, label: string, url: string) =>
        `<a href="${url.replaceAll('&quot;', '%22').replaceAll('&#39;', '%27')}" rel="noopener noreferrer">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Converts a small Markdown subset to safe HTML; raw HTML is always escaped. */
export function sanitizeRichText(value: string): string {
  const lines = value.replaceAll('\r\n', '\n').split('\n');
  const output: string[] = [];
  let listOpen = false;
  for (const line of lines) {
    const item = /^\s*[-*]\s+(.+)$/.exec(line);
    if (item) {
      if (!listOpen) {
        output.push('<ul>');
        listOpen = true;
      }
      output.push(`<li>${inline(item[1] ?? '')}</li>`);
      continue;
    }
    if (listOpen) {
      output.push('</ul>');
      listOpen = false;
    }
    if (line.trim()) output.push(`<p>${inline(line.trim())}</p>`);
  }
  if (listOpen) output.push('</ul>');
  return output.join('');
}
