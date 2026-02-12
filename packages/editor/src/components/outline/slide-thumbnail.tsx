import { Stage, Layer, Rect, Text } from 'react-konva';
import type { Slide, SlideDimensions } from '../../types/slide';

const THUMBNAIL_WIDTH = 160;

interface SlideThumbnailProps {
  slide: Slide;
  dimensions: SlideDimensions;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function SlideThumbnail({
  slide,
  dimensions,
  index,
  isActive,
  onClick,
}: SlideThumbnailProps) {
  const scale = THUMBNAIL_WIDTH / dimensions.width;
  const thumbnailHeight = dimensions.height * scale;

  return (
    <button
      onClick={onClick}
      className={`relative block w-full text-left rounded-lg overflow-hidden border-2 transition-colors ${
        isActive
          ? 'border-editor-primary ring-2 ring-editor-primary-ring'
          : 'border-editor-border-secondary hover:border-editor-muted-foreground'
      }`}
    >
      <div className="absolute top-1 left-1 z-10 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
        {index + 1}
      </div>
      <Stage
        width={THUMBNAIL_WIDTH}
        height={thumbnailHeight}
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
    </button>
  );
}
