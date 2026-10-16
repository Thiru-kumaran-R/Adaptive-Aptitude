// src/utils/markdownSanitizer.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const SANITIZER_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code', 'pre',
    'h2', 'h3', 'h4', 'blockquote', 'hr', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'span'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
};

export function renderSanitizedMarkdown(rawMarkdown: string): string {
  const dirtyHtml = marked.parse(rawMarkdown, { async: false }) as string;
  return DOMPurify.sanitize(dirtyHtml, SANITIZER_CONFIG);
}
