import { useEditor } from '../../state/editor-context';
import { SlideThumbnail } from './slide-thumbnail';

export function SlideOutlinePanel() {
  const { state, dispatch } = useEditor();
  const { presentation, activeSlideIndex } = state;

  return (
    <div className="w-[200px] shrink-0 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Slides
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {presentation.slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            dimensions={presentation.dimensions}
            index={index}
            isActive={index === activeSlideIndex}
            onClick={() => dispatch({ type: 'SELECT_SLIDE', index })}
          />
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => dispatch({ type: 'ADD_SLIDE' })}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          + Add Slide
        </button>
      </div>
    </div>
  );
}
