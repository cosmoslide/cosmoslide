import { useState, useCallback } from 'react';
import Konva from 'konva';
import { jsPDF } from 'jspdf';
import type { Presentation } from '../types/slide';

function pxToMm(px: number): number {
  return (px / 96) * 25.4;
}

export interface UseSlideExportResult {
  exportPdf: () => Promise<Blob | null>;
  isExporting: boolean;
  error: string | null;
}

/**
 * Renders each slide of a Presentation to a Konva Stage off-screen,
 * captures it as an image, and composes a PDF with jsPDF.
 */
export function useSlideExport(
  presentation: Presentation,
): UseSlideExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const { dimensions, slides } = presentation;
      const widthMm = pxToMm(dimensions.width);
      const heightMm = pxToMm(dimensions.height);
      const pixelRatio = 2;

      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm],
      });

      // Create an off-screen container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      try {
        for (let i = 0; i < slides.length; i++) {
          if (i > 0) {
            pdf.addPage([widthMm, heightMm]);
          }

          const slide = slides[i];

          // Create a temporary Konva stage for this slide
          const stage = new Konva.Stage({
            container,
            width: dimensions.width,
            height: dimensions.height,
          });

          const layer = new Konva.Layer();
          stage.add(layer);

          // Background
          const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            fill: slide.background,
          });
          layer.add(bg);

          // Render elements
          for (const element of slide.elements) {
            if (element.type === 'text') {
              const text = new Konva.Text({
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                rotation: element.rotation,
                text: element.content,
                fontSize: element.fontSize,
                fontFamily: element.fontFamily,
                fill: element.color,
                align: element.textAlign,
                verticalAlign: 'top',
                wrap: 'word',
              });
              layer.add(text);
            }
          }

          layer.draw();

          const dataUrl = stage.toDataURL({ pixelRatio });
          pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm);

          stage.destroy();
        }
      } finally {
        document.body.removeChild(container);
      }

      const blob = pdf.output('blob');
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF export failed';
      setError(message);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [presentation]);

  return { exportPdf, isExporting, error };
}
