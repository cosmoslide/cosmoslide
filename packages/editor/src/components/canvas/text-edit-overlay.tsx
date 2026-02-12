import { useState, useRef, useEffect } from 'react';
import type { TextElement } from '../../types/slide';

interface TextEditOverlayProps {
  element: TextElement;
  /** Scale factor applied to the canvas (for positioning the overlay correctly) */
  scale: number;
  /** Offset of the stage container from the viewport */
  stagePosition: { x: number; y: number };
  onFinish: (id: string, content: string) => void;
  onCancel: () => void;
}

export function TextEditOverlay({
  element,
  scale,
  stagePosition,
  onFinish,
  onCancel,
}: TextEditOverlayProps) {
  const [value, setValue] = useState(element.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  }, []);

  const handleBlur = () => {
    onFinish(element.id, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFinish(element.id, value);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: stagePosition.x + element.x * scale,
        top: stagePosition.y + element.y * scale,
        width: element.width * scale,
        minHeight: element.height * scale,
        fontSize: element.fontSize * scale,
        fontFamily: element.fontFamily,
        color: element.color,
        textAlign: element.textAlign,
        border: '2px solid var(--editor-primary)',
        borderRadius: 2,
        padding: 0,
        margin: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        resize: 'none',
        outline: 'none',
        overflow: 'hidden',
        lineHeight: 1.2,
        zIndex: 1000,
        transformOrigin: 'top left',
      }}
    />
  );
}
