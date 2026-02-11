import { useEditor, createTextElement } from '../../state/EditorContext';
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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-3 flex-wrap">
      {/* Element tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAddText}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Add text element"
        >
          + Text
        </button>

        {selectedElementIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            title="Delete selected"
          >
            Delete
          </button>
        )}
      </div>

      {/* Text alignment (only when text selected) */}
      {isTextSelected && (
        <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => handleAlignChange(align)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedElement.textAlign === align
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
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
        <label className="text-xs text-gray-500 dark:text-gray-400">
          Size:
        </label>
        <select
          value={`${dimensions.width}x${dimensions.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number);
            handleDimensionChange({ width: w, height: h });
          }}
          className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
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
      <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onPrint}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Print
        </button>
        <button
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Download PDF'}
        </button>
        <button
          onClick={onPublish}
          disabled={isExporting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
