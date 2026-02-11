// WYSIWYG Slide Editor
export { SlideEditor } from './components/SlideEditor';

// Types
export type {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  SlideDimensions,
  SlidePreset,
} from './types/slide';
export { SLIDE_PRESETS, DEFAULT_DIMENSIONS } from './types/slide';

// Hooks
export { useSlideExport } from './hooks/useSlideExport';

// Legacy exports (kept for backward compatibility until cleanup)
export {
  MarkdownToPdfApp,
  MarkdownEditor,
  MarkdownPreview,
  PrintButton,
  PageSizeControls,
} from './components';

export { usePdfExport } from './hooks';
export type {
  PdfExportOptions,
  OnExportCallback,
  UsePdfExportResult,
} from './hooks';

export type { PageSize, ParsedPage, EditorConfig } from './types';

export {
  parseMarkdownToPages,
  generatePaginatedHtml,
} from './utils/markdownParser';
export {
  generateIframeDocument,
  generatePrintStyles,
} from './utils/printStyles';
