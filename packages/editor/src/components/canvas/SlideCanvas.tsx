import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useEditor } from '../../state/EditorContext';
import { TextNode } from './TextNode';
import { SelectionTransformer } from './SelectionTransformer';
import { TextEditOverlay } from './TextEditOverlay';
import type { TextElement } from '../../types/slide';

export interface SlideCanvasHandle {
  getStage: () => Konva.Stage | null;
}

export function SlideCanvas() {
  const { state, dispatch, activeSlide } = useEditor();
  const { dimensions } = state.presentation;

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Calculate scale to fit canvas in container
  const updateScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const padding = 40;
    const availableWidth = container.clientWidth - padding * 2;
    const availableHeight = container.clientHeight - padding * 2;

    const scaleX = availableWidth / dimensions.width;
    const scaleY = availableHeight / dimensions.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(newScale);

    // Center the stage
    const stageWidth = dimensions.width * newScale;
    const stageHeight = dimensions.height * newScale;
    setStagePosition({
      x: (container.clientWidth - stageWidth) / 2,
      y: (container.clientHeight - stageHeight) / 2,
    });
  }, [dimensions]);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [updateScale]);

  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Click on empty area deselects
    if (
      e.target === e.target.getStage() ||
      e.target.name() === 'slide-background'
    ) {
      dispatch({ type: 'SELECT_ELEMENT', elementId: null });
    }
  };

  const handleSelect = (id: string) => {
    dispatch({ type: 'SELECT_ELEMENT', elementId: id });
  };

  const handleChange = (id: string, updates: Partial<TextElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', elementId: id, updates });
  };

  const handleDblClick = (id: string) => {
    setEditingElementId(id);
    dispatch({ type: 'SELECT_ELEMENT', elementId: null });
  };

  const handleTextEditFinish = (id: string, content: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', elementId: id, updates: { content } });
    setEditingElementId(null);
    dispatch({ type: 'SELECT_ELEMENT', elementId: id });
  };

  const handleTextEditCancel = () => {
    setEditingElementId(null);
  };

  const editingElement = editingElementId
    ? (activeSlide.elements.find((el) => el.id === editingElementId) as
        | TextElement
        | undefined)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-gray-200 dark:bg-gray-800"
    >
      <div
        style={{
          position: 'absolute',
          left: stagePosition.x,
          top: stagePosition.y,
        }}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width * scale}
          height={dimensions.height * scale}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Layer>
            {/* Slide background */}
            <Rect
              name="slide-background"
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill={activeSlide.background}
            />

            {/* Elements */}
            {activeSlide.elements.map((element) => {
              if (element.type === 'text' && element.id !== editingElementId) {
                return (
                  <TextNode
                    key={element.id}
                    element={element}
                    onSelect={handleSelect}
                    onChange={handleChange}
                    onDblClick={handleDblClick}
                  />
                );
              }
              return null;
            })}

            {/* Selection transformer */}
            <SelectionTransformer
              selectedIds={state.selectedElementIds}
              stageRef={stageRef}
            />
          </Layer>
        </Stage>
      </div>

      {/* Text edit overlay */}
      {editingElement && (
        <TextEditOverlay
          element={editingElement}
          scale={scale}
          stagePosition={stagePosition}
          onFinish={handleTextEditFinish}
          onCancel={handleTextEditCancel}
        />
      )}
    </div>
  );
}
