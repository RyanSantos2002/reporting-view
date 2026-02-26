import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { UIElement } from '../types';
import { useReportStore } from '../store/useReportStore';

interface DraggableElementProps {
  element: UIElement;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({ element }) => {
  const { id, type, x, y, width, height, properties } = element;
  const { selectedElementIds, selectElement } = useReportStore();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      type: 'existent',
      element,
    },
  });

  const isSelected = selectedElementIds.includes(id);

  // Render content based on element type
  const renderContent = () => {
    switch (type) {
      case 'Text':
        return <span style={{ 
          fontSize: `${properties.fontSize}px`, 
          fontFamily: properties.fontFamily,
          color: properties.color,
          fontWeight: properties.fontWeight,
          textAlign: properties.textAlign,
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}>{properties.text}</span>;
      case 'DataField':
        return <span style={{ 
          fontSize: `${properties.fontSize}px`, 
          fontFamily: properties.fontFamily,
          color: '#2563eb', // Emphasize it's a dynamic data field
          fontWeight: 'bold',
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}>[{properties.dataField}]</span>;
      case 'Line':
        return <div style={{ 
          width: '100%', 
          height: `${properties.borderWidth || 1}px`, 
          backgroundColor: properties.borderColor || '#000',
          marginTop: `${height / 2}px`
        }} />;
      default:
        return <span>Unknown</span>;
    }
  };

  // If dragging, we still render it but might apply transforms if we want
  // Often DndKit uses a DragOverlay for the moving copy.
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    border: isSelected ? '2px solid #3b82f6' : '1px dashed transparent',
    backgroundColor: properties.backgroundColor || 'transparent',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none', // Prevents accidental text selection while dragging
    WebkitUserSelect: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(id, e.shiftKey); // Ativa o MultiSelect se segurar Shift
      }}
      className={`group transition-colors ${isSelected ? 'shadow-md outline-none ring-2 ring-blue-500 ring-offset-1 z-50' : 'hover:border-gray-300 z-10'}`}
    >
      {renderContent()}
    </div>
  );
};
