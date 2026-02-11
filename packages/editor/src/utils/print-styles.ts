import type { PageSize } from '../types';

/**
 * Generate CSS for print-accurate preview and PDF export
 * This CSS is injected into the iframe
 */
export function generatePrintStyles(pageSize: PageSize): string {
  const { width, height, margin } = pageSize;
  const contentWidth = width - margin * 2;
  const contentHeight = height - margin * 2;

  return `
/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #000;
  background: #fff;
}

/* Page container styles */
.page {
  width: ${contentWidth}mm;
  min-height: ${contentHeight}mm;
  padding: ${margin}mm;
  margin: 0 auto 20px auto;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  /* Page break control */
  page-break-after: always;
  break-after: page;
  page-break-inside: avoid;
  break-inside: avoid;
}

.page.last-page {
  page-break-after: auto;
  break-after: auto;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.75em; }

p {
  margin: 0 0 1em 0;
}

/* Lists */
ul, ol {
  margin: 0 0 1em 0;
  padding-left: 2em;
}

li {
  margin-bottom: 0.25em;
}

/* Code blocks */
pre {
  background: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0 0 1em 0;
}

code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  background: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

pre code {
  padding: 0;
  background: none;
}

/* Blockquotes */
blockquote {
  margin: 0 0 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #ddd;
  color: #666;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em 0;
}

th, td {
  padding: 0.5em;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background: #f5f5f5;
  font-weight: 600;
}

/* Horizontal rule */
hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1.5em 0;
}

/* Links */
a {
  color: #0066cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
}

/* @page rule for PDF export */
@page {
  size: ${width}mm ${height}mm;
  margin: 0;
}

/* Print-specific styles */
@media print {
  html, body {
    width: ${width}mm;
    height: ${height}mm;
    margin: 0;
    padding: 0;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  .page {
    width: ${width}mm;
    height: ${height}mm;
    min-height: ${height}mm;
    max-height: ${height}mm;
    padding: ${margin}mm;
    margin: 0;
    box-shadow: none;

    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .page.last-page {
    page-break-after: auto;
    break-after: auto;
  }

  /* Prevent orphaned headers */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Keep images with their captions */
  img, figure {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}

/* Preview-specific styles (non-print) */
@media screen {
  :root {
    --preview-scale: 0.5; /* Default, will be overridden by JS */
    --page-width-px: calc(${width}mm * 3.7795275591);
    --page-height-px: calc(${height}mm * 3.7795275591);
  }

  body {
    background: #e5e5e5;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-height: 100vh;
  }

  /* Wrapper maintains scaled dimensions for proper spacing */
  .page-wrapper {
    width: calc(${width}mm * var(--preview-scale));
    height: calc(${height}mm * var(--preview-scale));
    position: relative;
    flex-shrink: 0;
  }

  .page {
    /* Use full page dimensions in preview */
    width: ${width}mm;
    height: ${height}mm;
    min-height: ${height}mm;
    padding: ${margin}mm;
    margin: 0;

    /* Scale to fit viewport using JS-calculated scale */
    transform: scale(var(--preview-scale));
    transform-origin: top left;

    /* Visual page indicator in preview */
    position: absolute;
    top: 0;
    left: 0;
  }

  .page::before {
    content: 'Page ' attr(data-page);
    position: absolute;
    top: 8px;
    right: 12px;
    font-size: 10px;
    color: #999;
    font-family: sans-serif;
  }
}

/* Print: Remove wrapper styling */
@media print {
  .page-wrapper {
    display: contents;
  }
}
`;
}

/**
 * Generate complete HTML document with styles for iframe
 * Includes script for responsive scaling in preview mode
 */
export function generateIframeDocument(
  content: string,
  pageSize: PageSize,
): string {
  const styles = generatePrintStyles(pageSize);
  const { width } = pageSize;

  // Script to calculate and apply scale factor based on container width (fit-width)
  const scaleScript = `
    <script>
      (function() {
        const PAGE_WIDTH_MM = ${width};
        const MM_TO_PX = 3.7795275591; // 96 DPI

        function updateScale() {
          const viewportWidth = window.innerWidth - 40; // padding
          const pageWidthPx = PAGE_WIDTH_MM * MM_TO_PX;

          // Scale to fit width only
          const scale = Math.min(viewportWidth / pageWidthPx, 1);

          document.documentElement.style.setProperty('--preview-scale', scale);
        }

        updateScale();
        window.addEventListener('resize', updateScale);
      })();
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Preview</title>
  <style>${styles}</style>
</head>
<body>
${content}
${scaleScript}
</body>
</html>`;
}
