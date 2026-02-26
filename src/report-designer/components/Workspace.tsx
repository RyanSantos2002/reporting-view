import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { ReportBand } from '../types';
import { useReportStore } from '../store/useReportStore';
import { DraggableElement } from './DraggableElement';
import { Trash2, Plus } from 'lucide-react';

interface BandProps {
  band: ReportBand;
}

export const Band: React.FC<BandProps> = ({ band }) => {
  const { id, name, height } = band;
  const allElements = useReportStore((state) => state.report.elements);
  const { updateBandHeight, removeBand } = useReportStore();
  const elements = allElements.filter((el) => el.bandId === id);

  const isCustomBand = !['ReportHeader', 'PageHeader', 'Detail', 'ReportFooter', 'PageFooter'].includes(id);

  // Resize State
  const [isResizing, setIsResizing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [startHeight, setStartHeight] = React.useState(height);
  
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'band',
      bandId: id,
    },
  });

  // Global mouse listeners for resizing
  React.useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault(); // Stop text selection
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(20, startHeight + deltaY); // Minimum 20px
      updateBandHeight(id, newHeight);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, startY, startHeight, id, updateBandHeight]);

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  return (
    <div className="relative mb-4 group">
      {/* Section Label & Delete Button (if custom) */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <div className="text-xs font-mono text-gray-400 rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
          {name}
        </div>
        {isCustomBand && (
           <button 
             onClick={(e) => { e.stopPropagation(); removeBand(id); }}
             className="text-red-400 hover:text-red-600 bg-white shadow rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
             title="Excluir banda"
           >
             <Trash2 size={14} />
           </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        style={{ height: `${height}px` }}
        className={`
          w-[794px] mx-auto bg-white border border-dashed relative overflow-hidden shadow-sm
          ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-red-200" />
        {elements.map((el) => (
          <DraggableElement key={el.id} element={el} />
        ))}
      </div>
      {/* Drag Resize Bottom Handle */}
      <div 
        className={`
          w-[794px] mx-auto h-2 cursor-row-resize flex items-center justify-center
          ${isResizing ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-100 hover:bg-blue-300'}
          transition-all absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2
        `}
        onPointerDown={handleResizeStart}
        title="Clique e arraste para alterar a altura da seção"
      >
        {/* Visual Line inside handle */}
        <div className="w-16 h-1 rounded flex flex-col justify-between gap-0.5 pointer-events-none">
           <div className="w-full h-px bg-gray-400"></div>
           <div className="w-full h-px bg-gray-400"></div>
           <div className="w-full h-px bg-gray-400"></div>
        </div>
      </div>
    </div>
  );
};

export const Workspace: React.FC = () => {
  const bands = useReportStore((state) => state.report.bands);
  const { clearSelection } = useReportStore();

  return (
    <div 
      className="flex-1 bg-gray-100 overflow-y-auto p-8 flex flex-col items-center relative"
      onClick={() => clearSelection()}
    >
      {/* Band Management Toolbar */}
      <div className="bg-white px-4 py-2 rounded-full shadow-md mb-6 flex items-center gap-2 sticky top-0 z-50 animate-fade-in-down border border-gray-200">
        <span className="text-sm font-medium text-gray-600 mr-2">Nova Banda:</span>
        <button onClick={() => useReportStore.getState().addBand('PageHeader')} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"><Plus size={12}/> Cabeçalho</button>
        <button onClick={() => useReportStore.getState().addBand('Detail')} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"><Plus size={12}/> Detalhe</button>
        <button onClick={() => useReportStore.getState().addBand('PageFooter')} className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"><Plus size={12}/> Rodapé</button>
      </div>

      {/* A4 Paper background simulation container */}
      <div className="flex flex-col mb-20 shadow-lg">
        {bands.map((band) => (
          band.visible && <Band key={band.id} band={band} />
        ))}
      </div>
    </div>
  );
};
