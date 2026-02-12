import { useEffect } from 'react';
import { useEditor } from '../../state/editor-context';
import { SlideThumbnail } from './slide-thumbnail';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '../ui/context-menu';

export function SlideOutlinePanel() {
  const { state, dispatch } = useEditor();
  const { presentation, activeSlideIndex } = state;
  const { slides } = presentation;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    dispatch({ type: 'SELECT_SLIDE', index: clamped });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goTo(activeSlideIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goTo(activeSlideIndex - 1);
      } else if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_PREVIEW' });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch({
          type: 'DELETE_SLIDE',
          slideId: slides[activeSlideIndex].id,
        });
        goTo(activeSlideIndex);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeSlideIndex, slides.length, dispatch]);

  return (
    <div className="w-[200px] shrink-0 bg-editor-muted border-r border-editor-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-editor-muted-foreground uppercase tracking-wider">
        Slides
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {presentation.slides.map((slide, index) => (
          <ContextMenu key={slide.id}>
            <ContextMenuTrigger asChild>
              <div>
                <SlideThumbnail
                  slide={slide}
                  dimensions={presentation.dimensions}
                  index={index}
                  isActive={index === activeSlideIndex}
                  onClick={() => dispatch({ type: 'SELECT_SLIDE', index })}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onSelect={() =>
                  dispatch({ type: 'DUPLICATE_SLIDE', slideId: slide.id })
                }
              >
                Duplicate Slide
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() =>
                  dispatch({ type: 'INSERT_SLIDE_AFTER', afterIndex: index })
                }
              >
                Add Slide Below
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                disabled={slides.length <= 1}
                onSelect={() =>
                  dispatch({ type: 'DELETE_SLIDE', slideId: slide.id })
                }
              >
                Delete Slide
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      <div className="p-3 border-t border-editor-border">
        <button
          onClick={() => dispatch({ type: 'ADD_SLIDE' })}
          className="w-full px-3 py-2 text-sm bg-editor-surface border border-editor-border-secondary rounded-lg hover:bg-editor-surface-hover transition-colors text-editor-foreground"
        >
          + Add Slide
        </button>
      </div>
    </div>
  );
}
