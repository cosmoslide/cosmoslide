import { useCallback } from 'react';

/**
 * Props for the PrintButton component.
 */
interface PrintButtonProps {
  /** Reference to the preview iframe to trigger printing */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Whether the button is disabled (default: false) */
  disabled?: boolean;
}

/**
 * Button component that triggers the browser's native print dialog.
 *
 * Uses the iframe's contentWindow.print() to open the system print dialog,
 * allowing users to export the document as PDF or print to a physical printer.
 *
 * @example
 * ```tsx
 * const iframeRef = useRef<HTMLIFrameElement>(null);
 *
 * <PrintButton iframeRef={iframeRef} />
 * <PrintButton iframeRef={iframeRef} disabled={true} />
 * ```
 */
export function PrintButton({ iframeRef, disabled = false }: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      console.error('Cannot access iframe content window');
      return;
    }

    // Trigger the browser's native print dialog
    iframe.contentWindow.print();
  }, [iframeRef]);

  return (
    <button
      onClick={handlePrint}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: disabled ? '#ccc' : '#0066cc',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#0052a3';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#0066cc';
        }
      }}
    >
      Export to PDF
    </button>
  );
}
