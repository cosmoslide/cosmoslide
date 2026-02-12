import { useEditor, createTextElement } from '../../state/editor-context';
import { SLIDE_PRESETS } from '../../types/slide';
import type { SlideDimensions } from '../../types/slide';

interface EditorToolbarProps {
  onDownloadPdf: () => void;
  onPublish: () => void;
  onPrint: () => void;
  isExporting: boolean;
}

export function EditorToolbar({
  onDownloadPdf,
  onPublish,
  onPrint,
  isExporting,
}: EditorToolbarProps) {
  const { state, dispatch } = useEditor();
  const { dimensions } = state.presentation;
  const selectedElementIds = state.selectedElementIds;

  const handleAddText = () => {
    dispatch({ type: 'ADD_ELEMENT', element: createTextElement() });
  };

  const handleDeleteSelected = () => {
    for (const id of selectedElementIds) {
      dispatch({ type: 'DELETE_ELEMENT', elementId: id });
    }
  };

  const handleDimensionChange = (dims: SlideDimensions) => {
    dispatch({ type: 'SET_DIMENSIONS', dimensions: dims });
  };

  // Find current text element for alignment
  const activeSlide = state.presentation.slides[state.activeSlideIndex];
  const selectedElement =
    selectedElementIds.length === 1
      ? activeSlide?.elements.find((el) => el.id === selectedElementIds[0])
      : null;
  const isTextSelected = selectedElement?.type === 'text';

  const handleAlignChange = (textAlign: 'left' | 'center' | 'right') => {
    if (selectedElement) {
      dispatch({
        type: 'UPDATE_ELEMENT',
        elementId: selectedElement.id,
        updates: { textAlign },
      });
    }
  };

  return (
    <header className="bg-editor-surface border-b border-editor-border px-4 py-2 flex items-center gap-3 flex-wrap">
      {/* Element tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAddText}
          className="px-3 py-1.5 text-sm bg-editor-muted text-editor-foreground rounded hover:bg-editor-muted-hover transition-colors"
          title="Add text element"
        >
          + Text
        </button>

        {selectedElementIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 text-sm bg-editor-destructive-muted text-editor-destructive-muted-foreground rounded hover:bg-editor-destructive-hover transition-colors"
            title="Delete selected"
          >
            Delete
          </button>
        )}
      </div>

      {/* Text alignment (only when text selected) */}
      {isTextSelected && (
        <div className="flex items-center gap-1 border-l border-editor-border pl-3">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => handleAlignChange(align)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedElement.textAlign === align
                  ? 'bg-editor-primary-muted text-editor-primary-muted-foreground'
                  : 'bg-editor-muted text-editor-muted-foreground hover:bg-editor-muted-hover'
              }`}
              title={`Align ${align}`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Slide size */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-editor-muted-foreground">Size:</label>
        <select
          value={`${dimensions.width}x${dimensions.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number);
            handleDimensionChange({ width: w, height: h });
          }}
          className="text-sm bg-editor-muted text-editor-foreground rounded px-2 py-1 border border-editor-border-secondary"
        >
          {SLIDE_PRESETS.map((preset) => (
            <option
              key={preset.label}
              value={`${preset.dimensions.width}x${preset.dimensions.height}`}
            >
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-l border-editor-border pl-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          className="px-3 py-1.5 text-sm bg-editor-muted text-editor-foreground rounded hover:bg-editor-muted-hover transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onPrint}
          className="px-3 py-1.5 text-sm bg-editor-muted text-editor-foreground rounded hover:bg-editor-muted-hover transition-colors"
        >
          Print
        </button>
        <button
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="px-3 py-1.5 text-sm bg-editor-muted-hover text-editor-foreground rounded hover:bg-editor-muted transition-colors disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Download PDF'}
        </button>
        <button
          onClick={onPublish}
          disabled={isExporting}
          className="px-3 py-1.5 text-sm bg-editor-primary-bg text-white rounded hover:bg-editor-primary-hover transition-colors disabled:opacity-50"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
