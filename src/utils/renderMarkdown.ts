import DOMPurify from 'dompurify';
import { marked } from 'marked';

/** Shared by article readers and the Markdown tool. Never inject unsanitized parser output. */
export function renderMarkdown(content: string): string {
  if (!content.trim()) return '';
  const parsed = marked.parse(content, { async: false, gfm: true });
  return DOMPurify.sanitize(parsed, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['form', 'input', 'button', 'select', 'textarea', 'style'],
    FORBID_ATTR: ['style', 'tabindex', 'autofocus'],
  });
}
