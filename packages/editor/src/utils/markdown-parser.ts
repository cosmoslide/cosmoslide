import MarkdownIt from 'markdown-it';
import type { ParsedPage } from '../types';

// Initialize markdown-it with CommonMark compatibility
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

/**
 * Page delimiter patterns:
 * - ---page--- (on its own line)
 * - \f (form feed character)
 */
const PAGE_DELIMITER_REGEX = /(?:^---page---$|\f)/gm;

/**
 * Split markdown content by page delimiters
 * Page delimiters are parsed BEFORE markdown rendering
 */
export function splitByPageDelimiters(markdown: string): string[] {
  // Normalize line endings
  const normalized = markdown.replace(/\r\n/g, '\n');

  // Split by page delimiters
  const pages = normalized.split(PAGE_DELIMITER_REGEX);

  // Filter out empty pages but keep at least one page
  const filteredPages = pages.filter((page, index) => {
    // Keep first page even if empty
    if (index === 0) return true;
    // Filter out completely empty pages
    return page.trim().length > 0;
  });

  return filteredPages.length > 0 ? filteredPages : [''];
}

/**
 * Convert a single markdown page to HTML
 */
export function markdownToHtml(markdown: string): string {
  return md.render(markdown);
}

/**
 * Parse markdown content into paginated HTML
 * Each page is rendered independently, then concatenated
 */
export function parseMarkdownToPages(markdown: string): ParsedPage[] {
  const pageContents = splitByPageDelimiters(markdown);

  return pageContents.map((content, index) => ({
    index,
    markdown: content,
    html: markdownToHtml(content),
  }));
}

/**
 * Generate the complete HTML document for preview/print
 * Each page is wrapped in a <section class="page"> element
 * For screen preview, pages are wrapped in .page-wrapper for proper scaled spacing
 */
export function generatePaginatedHtml(pages: ParsedPage[]): string {
  return pages
    .map((page, index) => {
      const isLastPage = index === pages.length - 1;
      // Don't add page-break-after on the last page
      const pageClass = isLastPage ? 'page last-page' : 'page';
      // Wrap in page-wrapper for screen preview scaling
      return `<div class="page-wrapper"><section class="${pageClass}" data-page="${page.index + 1}">${page.html}</section></div>`;
    })
    .join('\n');
}
