import { useMemo, forwardRef } from 'react';
import {
  parseMarkdownToPages,
  generatePaginatedHtml,
} from '../utils/markdown-parser';
import { generateIframeDocument } from '../utils/print-styles';
import type { PageSize } from '../types';

/**
 * Props for the MarkdownPreview component.
 */
interface MarkdownPreviewProps {
  /** The markdown content to render */
  markdown: string;
  /** Page size configuration (width, height, margin in mm) */
  pageSize: PageSize;
}

/**
 * iframe-based Markdown preview component that renders print-accurate output.
 *
 * The preview content is identical to what will be printed/exported as PDF.
 * Uses memoization to optimize performance when content or page size changes.
 *
 * Features:
 * - Print-accurate rendering using iframe srcdoc
 * - Paginated display with page break support
 * - Exposes iframe ref for print triggering
 *
 * @example
 * ```tsx
 * const iframeRef = useRef<HTMLIFrameElement>(null);
 * const pageSize = { width: 210, height: 297, margin: 20 };
 *
 * <MarkdownPreview
 *   ref={iframeRef}
 *   markdown="# Hello World"
 *   pageSize={pageSize}
 * />
 * ```
 */
export const MarkdownPreview = forwardRef<
  HTMLIFrameElement,
  MarkdownPreviewProps
>(function MarkdownPreview({ markdown, pageSize }, ref) {
  // Parse markdown into pages and generate HTML
  const srcdoc = useMemo(() => {
    const pages = parseMarkdownToPages(markdown);
    const paginatedHtml = generatePaginatedHtml(pages);
    return generateIframeDocument(paginatedHtml, pageSize);
  }, [markdown, pageSize]);

  return (
    <iframe
      ref={ref}
      srcDoc={srcdoc}
      title="Markdown Preview"
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#e5e5e5',
      }}
    />
  );
});
