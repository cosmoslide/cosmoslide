import { useRef, useEffect } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextElement } from '../../types/slide';

interface TextNodeProps {
  element: TextElement;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<TextElement>) => void;
  onDblClick: (id: string) => void;
}

export function TextNode({
  element,
  onSelect,
  onChange,
  onDblClick,
}: TextNodeProps) {
  const textRef = useRef<Konva.Text>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.getLayer()?.batchDraw();
    }
  }, [element]);

  return (
    <Text
      ref={textRef}
      id={element.id}
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
      verticalAlign="top"
      wrap="word"
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDblClick={() => onDblClick(element.id)}
      onDblTap={() => onDblClick(element.id)}
      onDragEnd={(e) => {
        onChange(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = textRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale and apply to width/height
        node.scaleX(1);
        node.scaleY(1);

        onChange(element.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
