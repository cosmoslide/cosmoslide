import { useState, useRef } from 'react';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownPreview } from './markdown-preview';
import { PrintButton } from './print-button';
import { PageSizeControls } from './page-size-controls';
import type { PageSize } from '../types';

// Default page size (custom book format)
const DEFAULT_PAGE_SIZE: PageSize = {
  width: 254,
  height: 143,
  margin: 10,
};

// Sample markdown with page delimiters
const SAMPLE_MARKDOWN = `# Welcome to CosmosSlide

A browser-based Markdown to PDF editor with precise pagination control.

## Features

- **Live Preview**: See your document exactly as it will print
- **Custom Page Sizes**: Configure width, height, and margins
- **Page Delimiters**: Use \`---page---\` or form feed (\\f) to create page breaks
- **Vector PDF Export**: Text remains selectable in exported PDFs

---page---

# Getting Started

## Writing Content

Simply type your Markdown in the editor on the left. The preview on the right updates in real-time.

## Creating Page Breaks

Insert a page break using the delimiter:

\`\`\`
---page---
\`\`\`

Or use the form feed character (\\f).

---page---

# Code Examples

## JavaScript

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Python

\`\`\`python
def hello(name):
    print(f"Hello, {name}!")
\`\`\`

---page---

# Exporting to PDF

1. Configure your page size using the controls above
2. Click the **Export to PDF** button
3. In the print dialog, select **Save as PDF**
4. Choose your destination and save

> **Tip**: For best results, ensure "Background graphics" is enabled in your print settings.

---page---

# Thank You

Visit our documentation for more information.

**Happy Writing!**
`;

/**
 * Main application component that composes the complete Markdown-to-PDF editor.
 *
 * This is the root component that manages application state and renders the
 * full two-panel interface with editor, preview, and controls.
 *
 * Features:
 * - Header with title, page size controls, and export button
 * - Split-panel layout with markdown editor and live preview
 * - Footer with page break syntax help
 *
 * State:
 * - `markdown`: Current markdown content
 * - `pageSize`: Page dimensions and margin configuration
 *
 * @example
 * ```tsx
 * // In App.tsx or entry point
 * function App() {
 *   return <MarkdownToPdfApp />;
 * }
 * ```
 */
export function MarkdownToPdfApp() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      {/* Header / Toolbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#fff',
          borderBottom: '1px solid #ddd',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: '#333',
          }}
        >
          CosmosSlide Editor
        </h1>

        <PageSizeControls pageSize={pageSize} onChange={setPageSize} />

        <PrintButton iframeRef={iframeRef} />
      </header>

      {/* Main content area */}
      <main
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: '1px',
          background: '#ddd',
        }}
      >
        {/* Editor panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#666',
              borderBottom: '1px solid #eee',
              background: '#fafafa',
            }}
          >
            MARKDOWN EDITOR
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          </div>
        </div>

        {/* Preview panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#666',
              borderBottom: '1px solid #eee',
              background: '#fafafa',
            }}
          >
            PREVIEW (Print-Accurate)
          </div>
          <div style={{ flex: 1, overflow: 'hidden', padding: '8px' }}>
            <MarkdownPreview
              ref={iframeRef}
              markdown={markdown}
              pageSize={pageSize}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '8px 20px',
          fontSize: '12px',
          color: '#666',
          background: '#fff',
          borderTop: '1px solid #ddd',
          textAlign: 'center',
        }}
      >
        Use{' '}
        <code
          style={{
            background: '#f0f0f0',
            padding: '2px 4px',
            borderRadius: '2px',
          }}
        >
          ---page---
        </code>{' '}
        or{' '}
        <code
          style={{
            background: '#f0f0f0',
            padding: '2px 4px',
            borderRadius: '2px',
          }}
        >
          \f
        </code>{' '}
        to create page breaks
      </footer>
    </div>
  );
}
