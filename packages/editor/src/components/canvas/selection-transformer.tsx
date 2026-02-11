import { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

interface SelectionTransformerProps {
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function SelectionTransformer({
  selectedIds,
  stageRef,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== undefined);

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  if (selectedIds.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
      ]}
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}
