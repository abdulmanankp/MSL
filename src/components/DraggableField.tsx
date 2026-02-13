import Draggable from 'react-draggable';

export default function DraggableField({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <Draggable defaultPosition={{ x, y }}>
      <div style={{ position: 'absolute' }}>
        {children}
      </div>
    </Draggable>
  );
}
