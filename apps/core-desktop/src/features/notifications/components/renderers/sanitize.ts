/**
 * Robust lightweight HTML sanitizer and Markdown parser for 40Labs messaging system.
 * Prevents script injection, unsafe URLs, and dangerous event handlers.
 */

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // 1. Remove script tags and their contents
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove dangerous tags (iframe, object, embed, form, applet, meta, link)
  cleaned = cleaned.replace(/<\/?(iframe|object|embed|form|applet|meta|link|base)\b[^>]*>/gi, '');

  // 3. Remove inline event handlers (onload, onerror, onclick, onmouseover, etc.)
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(["'])(?:[^\\]|\\.)*\1/gi, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');

  // 4. Sanitize href and src attributes to block javascript: and vbscript: URIs
  cleaned = cleaned.replace(
    /\b(href|src)\s*=\s*(["'])\s*(javascript|vbscript|data\s*:\s*text\/html):[^"']*?\2/gi,
    '$1="#"'
  );
  cleaned = cleaned.replace(
    /\b(href|src)\s*=\s*(javascript|vbscript|data\s*:\s*text\/html):[^\s>]+/gi,
    '$1="#"'
  );

  return cleaned;
}

/**
 * Safe Markdown parser producing structured tokens or formatted text for aMob / internal messages.
 */
export interface MarkdownToken {
  type: 'heading' | 'paragraph' | 'list' | 'blockquote' | 'text';
  content: string;
  items?: string[];
  level?: number;
}

export function parseMarkdown(markdown: string): MarkdownToken[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const tokens: MarkdownToken[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      tokens.push({ type: 'list', content: '', items: [...currentListItems] });
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      continue;
    }

    // Headings (## Heading)
    if (line.startsWith('### ')) {
      flushList();
      tokens.push({ type: 'heading', level: 3, content: line.replace('### ', '') });
    } else if (line.startsWith('## ')) {
      flushList();
      tokens.push({ type: 'heading', level: 2, content: line.replace('## ', '') });
    } else if (line.startsWith('# ')) {
      flushList();
      tokens.push({ type: 'heading', level: 1, content: line.replace('# ', '') });
    }
    // Blockquotes (> Quote)
    else if (line.startsWith('> ')) {
      flushList();
      tokens.push({ type: 'blockquote', content: line.replace('> ', '') });
    }
    // Unordered list items (- item or * item)
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      currentListItems.push(line.substring(2).trim());
    } else {
      flushList();
      tokens.push({ type: 'paragraph', content: line });
    }
  }
  flushList();

  return tokens;
}

/**
 * Format inline markdown syntax (**bold**, *italic*, [link](url)) into safe elements or styled spans.
 */
export function formatInlineText(text: string): string {
  // Convert [link text](url) to safe HTML anchors
  let formatted = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-hover">$1</a>'
  );

  // Convert **bold**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-text">$1</strong>');

  // Convert *italic*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  return formatted;
}
