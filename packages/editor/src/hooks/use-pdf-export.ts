import { useCallback, useState } from 'react';
import type { PageSize } from '../types';

/**
 * Options for PDF export.
 */
export interface PdfExportOptions {
  /** Filename for the exported PDF (without extension) */
  filename?: string;
  /** Page size configuration */
  pageSize: PageSize;
}

/**
 * Callback function that receives the exported PDF blob.
 * Use this to upload the PDF to a server or external storage.
 *
 * @param blob - The PDF file as a Blob
 * @param filename - The suggested filename (with .pdf extension)
 */
export type OnExportCallback = (
  blob: Blob,
  filename: string,
) => void | Promise<void>;

/**
 * Return type for the usePdfExport hook.
 */
export interface UsePdfExportResult {
  /** Trigger PDF export. Returns the blob if successful. */
  exportPdf: () => Promise<Blob | null>;
  /** Whether an export is currently in progress */
  isExporting: boolean;
  /** Error message if the last export failed */
  error: string | null;
}

/**
 * Custom hook for exporting content to PDF with a callback for server upload.
 *
 * Uses html2canvas and jspdf to generate the PDF binary. The onExport callback
 * receives the PDF blob which can be uploaded to external storage.
 *
 * @param iframeRef - Reference to the preview iframe containing the content
 * @param options - Export options including filename and page size
 * @param onExport - Optional callback that receives the PDF blob for server upload
 *
 * @example
 * ```tsx
 * const iframeRef = useRef<HTMLIFrameElement>(null);
 * const pageSize = { width: 210, height: 297, margin: 20 };
 *
 * const { exportPdf, isExporting, error } = usePdfExport(
 *   iframeRef,
 *   { filename: 'document', pageSize },
 *   async (blob, filename) => {
 *     // Upload to server
 *     const formData = new FormData();
 *     formData.append('file', blob, filename);
 *     await fetch('/api/upload', { method: 'POST', body: formData });
 *   }
 * );
 *
 * <button onClick={exportPdf} disabled={isExporting}>
 *   {isExporting ? 'Exporting...' : 'Export PDF'}
 * </button>
 * ```
 */
export function usePdfExport(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: PdfExportOptions,
  onExport?: OnExportCallback,
): UsePdfExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async (): Promise<Blob | null> => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow?.document?.body) {
      setError('Cannot access iframe content');
      return null;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Dynamically import libraries to reduce initial bundle size
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPDFModule;

      const iframeDoc = iframe.contentWindow.document;
      const body = iframeDoc.body;

      // Find all page elements in the iframe
      const pages = body.querySelectorAll('.page');
      if (pages.length === 0) {
        throw new Error('No pages found in document');
      }

      const { width, height } = options.pageSize;

      // Create PDF with custom page size (dimensions in mm)
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [width, height],
      });

      // Render each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        // Capture page as canvas
        const canvas = await html2canvas(page, {
          scale: 2, // Higher resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        // Add new page (except for the first one)
        if (i > 0) {
          pdf.addPage([width, height]);
        }

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      }

      // Generate blob
      const blob = pdf.output('blob');
      const filename = `${options.filename || 'document'}.pdf`;

      // Call the onExport callback if provided
      if (onExport) {
        await onExport(blob, filename);
      }

      setIsExporting(false);
      return blob;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to export PDF';
      setError(message);
      setIsExporting(false);
      return null;
    }
  }, [iframeRef, options.pageSize, options.filename, onExport]);

  return {
    exportPdf,
    isExporting,
    error,
  };
}
