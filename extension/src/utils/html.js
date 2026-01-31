// Extremely small HTML-to-text helper.
// Not a full sanitizer; good enough for email bodies.

export function htmlToText(html) {
  if (!html) return '';

  // Replace common block boundaries with newlines.
  let s = html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*\/li\s*>/gi, '\n');

  // Strip tags.
  s = s.replace(/<[^>]+>/g, '');

  // Decode minimal entities.
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse whitespace.
  s = s.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
