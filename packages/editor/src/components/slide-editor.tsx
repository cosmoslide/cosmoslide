import Konva from 'konva';
import { EditorProvider, useEditor } from '../state/editor-context';
import { SlideCanvas } from './canvas/slide-canvas';
import { SlideOutlinePanel } from './outline/slide-outline-panel';
import { SlidePreview } from './preview/slide-preview';
import { EditorToolbar } from './toolbar/editor-toolbar';
import { useSlideExport } from '../hooks/use-slide-export';

interface SlideEditorProps {
  onPublish?: (blob: Blob) => void;
  theme?: string;
}

function SlideEditorInner({ onPublish, theme }: SlideEditorProps) {
  const { state } = useEditor();
  const { exportPdf, isExporting, error } = useSlideExport(state.presentation);

  const handleDownloadPdf = async () => {
    const blob = await exportPdf();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.presentation.title || 'presentation'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePublish = async () => {
    const blob = await exportPdf();
    if (blob && onPublish) {
      onPublish(blob);
    }
  };

  const handlePrint = async () => {
    const { presentation } = state;
    const { dimensions, slides } = presentation;

    // Generate images for each slide, then open print dialog
    const images: string[] = [];
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      for (const slide of slides) {
        const stage = new Konva.Stage({
          container,
          width: dimensions.width,
          height: dimensions.height,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        layer.add(
          new Konva.Rect({
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            fill: slide.background,
          }),
        );

        for (const element of slide.elements) {
          if (element.type === 'text') {
            layer.add(
              new Konva.Text({
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
                wrap: 'word',
              }),
            );
          }
        }

        layer.draw();
        images.push(stage.toDataURL({ pixelRatio: 2 }));
        stage.destroy();
      }
    } finally {
      document.body.removeChild(container);
    }

    // Open print window with slide images
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${presentation.title}</title>
  <style>
    @media print {
      @page { size: ${dimensions.width}px ${dimensions.height}px; margin: 0; }
      body { margin: 0; }
      .slide { page-break-after: always; }
      .slide:last-child { page-break-after: auto; }
    }
    body { margin: 0; background: white; }
    .slide { width: ${dimensions.width}px; height: ${dimensions.height}px; }
    .slide img { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${images.map((src) => `<div class="slide"><img src="${src}" /></div>`).join('\n')}
  <script>window.onload = function() { window.print(); window.close(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div
      className="h-full flex flex-col bg-editor-background text-editor-foreground"
      {...(theme ? { 'data-editor-theme': theme } : {})}
    >
      {!state.previewMode && (
        <EditorToolbar
          onDownloadPdf={handleDownloadPdf}
          onPublish={handlePublish}
          onPrint={handlePrint}
          isExporting={isExporting}
        />
      )}

      {error && (
        <div className="bg-editor-destructive-muted border-b border-editor-border px-4 py-2">
          <p className="text-sm text-editor-destructive-muted-foreground">
            {error}
          </p>
        </div>
      )}

      {state.previewMode ? (
        <SlidePreview />
      ) : (
        <main className="flex flex-1 overflow-hidden">
          <SlideOutlinePanel />
          <SlideCanvas />
        </main>
      )}
    </div>
  );
}

export function SlideEditor({ theme, ...props }: SlideEditorProps) {
  return (
    <EditorProvider>
      <SlideEditorInner theme={theme} {...props} />
    </EditorProvider>
  );
}
