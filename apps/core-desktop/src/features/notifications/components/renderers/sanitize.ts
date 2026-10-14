/**
 * Robust lightweight HTML sanitizer and Markdown parser for 40Labs messaging system.
 * Prevents script injection, unsafe URLs, and dangerous event handlers.
 */

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
 * Safe Markdown parser producing structured tokens for aMob / internal messages (including tables).
 */
export interface MarkdownToken {
  type: 'heading' | 'paragraph' | 'list' | 'blockquote' | 'table' | 'code' | 'text';
  content: string;
  items?: string[];
  level?: number;
  headers?: string[];
  rows?: string[][];
}

export function parseMarkdown(markdown: string): MarkdownToken[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const tokens: MarkdownToken[] = [];
  let currentListItems: string[] = [];
  let tableHeaders: string[] | null = null;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      tokens.push({ type: 'list', content: '', items: [...currentListItems] });
      currentListItems = [];
    }
  };

  const flushTable = () => {
    if (tableHeaders) {
      tokens.push({ type: 'table', content: '', headers: tableHeaders, rows: [...tableRows] });
      tableHeaders = null;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Table rows (| item | item |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      // Check if separator row (|---|---|)
      if (cells.every((c) => /^[:?-]+$/.test(c))) {
        continue; // Skip separator line
      }
      if (!tableHeaders) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Headings (### Heading)
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
  flushTable();

  return tokens;
}

/**
 * Format inline markdown syntax (**bold**, *italic*, _italic_, ~strike~, `code`, [link](url))
 * Escapes HTML first and strictly validates link URLs against http, https, mailto.
 */
export function formatInlineText(text: string): string {
  if (!text) return '';

  // 1. Escape HTML on the text
  let escaped = escapeHtml(text);

  // 2. Parse markdown links [label](url) securely in escaped text
  escaped = escaped.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g,
    (_match, label, rawUrl) => {
      const decodedUrl = rawUrl.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim();
      const isSafe = /^https?:\/\//i.test(decodedUrl) || /^mailto:/i.test(decodedUrl);
      const safeUrl = isSafe ? decodedUrl : '#';
      return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-hover">${label}</a>`;
    }
  );

  // Convert **bold**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-text">$1</strong>');
  // Convert *italic* or _italic_
  escaped = escaped.replace(/(?:\*|_)([^*_]+)(?:\*|_)/g, '<em class="italic">$1</em>');
  // Convert ~strike~
  escaped = escaped.replace(/~([^~]+)~/g, '<del class="line-through text-text-muted">$1</del>');
  // Convert `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-panel-strong font-mono text-[11px] text-text">$1</code>');

  return escaped;
}
