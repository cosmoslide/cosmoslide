import { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useEditor } from '../../state/EditorContext';

export function SlidePreview() {
  const { state, dispatch } = useEditor();
  const { presentation } = state;
  const { dimensions, slides } = presentation;

  const [currentIndex, setCurrentIndex] = useState(state.activeSlideIndex);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const padding = 60;
  const scaleX = (containerSize.width - padding * 2) / dimensions.width;
  const scaleY = (containerSize.height - padding * 2 - 60) / dimensions.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const slide = slides[currentIndex];

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    setCurrentIndex(clamped);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goTo(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goTo(currentIndex - 1);
      } else if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_PREVIEW' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, slides.length, dispatch]);

  if (!slide) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center bg-gray-900"
    >
      <div style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)' }}>
        <Stage
          width={dimensions.width * scale}
          height={dimensions.height * scale}
          scaleX={scale}
          scaleY={scale}
          listening={false}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill={slide.background}
            />
            {slide.elements.map((element) => {
              if (element.type === 'text') {
                return (
                  <Text
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    rotation={element.rotation}
                    text={element.content}
                    fontSize={element.fontSize}
                    fontFamily={element.fontFamily}
                    fill={element.color}
                    align={element.textAlign}
                    wrap="word"
                    listening={false}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="px-3 py-1.5 text-sm text-white bg-white/20 rounded hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span className="text-sm text-white/80">
          {currentIndex + 1} / {slides.length}
        </span>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === slides.length - 1}
          className="px-3 py-1.5 text-sm text-white bg-white/20 rounded hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          className="px-3 py-1.5 text-sm text-white bg-red-600/80 rounded hover:bg-red-600 transition-colors"
        >
          Exit Preview
        </button>
      </div>
    </div>
  );
}
