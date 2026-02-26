import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { ReportBand } from '../types';
import { useReportStore } from '../store/useReportStore';
import { DraggableElement } from './DraggableElement';
import { Trash2, Plus, Eye, EyeOff, X } from 'lucide-react';

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
      <div className="absolute -left-14 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <div className="text-[9px] font-black text-gray-500 rotate-180 whitespace-nowrap uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
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
  const guidelinesX = useReportStore((state) => state.guidelinesX);
  const guidelinesY = useReportStore((state) => state.guidelinesY);
  const { 
    clearSelection, 
    addGuidelineX, removeGuidelineX, updateGuidelineX,
    addGuidelineY, removeGuidelineY, updateGuidelineY,
    toggleBandVisibility 
  } = useReportStore();

  // Dragging state for guidelines
  const [draggingGuidelineX, setDraggingGuidelineX] = React.useState<number | null>(null);
  const [draggingGuidelineY, setDraggingGuidelineY] = React.useState<number | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTopRulerClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // Only if clicked on ruler directly, not markers
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    addGuidelineX(x);
  };

  const handleSideRulerClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.round(e.clientY - rect.top);
    addGuidelineY(y);
  };

  // Guideline Drag Handlers
  React.useEffect(() => {
    if (draggingGuidelineX === null && draggingGuidelineY === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      
      if (draggingGuidelineX !== null) {
        // Get canvas area rect (the relative div inside top flex)
        const canvasElement = containerRef.current.querySelector('.canvas-container');
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const newX = Math.round(e.clientX - rect.left);
          if (newX >= 0 && newX <= 794) {
            updateGuidelineX(draggingGuidelineX, newX);
            setDraggingGuidelineX(newX);
          }
        }
      }

      if (draggingGuidelineY !== null) {
        const canvasElement = containerRef.current.querySelector('.canvas-container');
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const newY = Math.round(e.clientY - rect.top);
          if (newY >= 0) {
            updateGuidelineY(draggingGuidelineY, newY);
            setDraggingGuidelineY(newY);
          }
        }
      }
    };

    const handlePointerUp = () => {
      setDraggingGuidelineX(null);
      setDraggingGuidelineY(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingGuidelineX, draggingGuidelineY, updateGuidelineX, updateGuidelineY]);

  const standardBands = ['ReportHeader', 'PageHeader', 'Detail', 'PageFooter', 'ReportFooter'];

  return (
    <div 
      className="flex-1 bg-gray-100 overflow-y-auto p-8 flex flex-col items-center relative select-none"
      onClick={() => clearSelection()}
    >
      {/* Band Management Toolbar */}
      <div className="bg-white px-6 py-3 rounded-full shadow-lg mb-6 flex items-center gap-4 sticky top-0 z-50 animate-fade-in-down border border-gray-200">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nova:</span>
          <button onClick={() => useReportStore.getState().addBand('PageHeader')} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"><Plus size={12}/> Cabeçalho</button>
          <button onClick={() => useReportStore.getState().addBand('Detail')} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"><Plus size={12}/> Detalhe</button>
          <button onClick={() => useReportStore.getState().addBand('PageFooter')} className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"><Plus size={12}/> Rodapé</button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ver:</span>
          {standardBands.map(id => {
            const band = bands.find(b => b.id === id);
            if (!band) return null;
            return (
              <button 
                key={id}
                onClick={() => toggleBandVisibility(id)}
                className={`
                  flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all uppercase font-bold
                  ${band.visible ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                `}
                title={band.name}
              >
                {band.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                {band.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative shadow-2xl flex" ref={containerRef}>
        {/* Corner Block */}
        <div className="w-6 h-6 bg-gray-300 border-r border-b border-gray-400 flex-shrink-0 z-50"></div>

        <div className="flex flex-col">
          {/* Top Ruler */}
          <div 
            className="w-[794px] h-6 bg-gray-200 border-b border-gray-300 relative cursor-crosshair flex-shrink-0"
            onPointerDown={handleTopRulerClick}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute bottom-0 h-2 border-l border-gray-400 pointer-events-none" 
                style={{ left: `${i * 50}px` }}
              >
                <span className="absolute -top-4 left-1 text-[8px] text-gray-500 font-mono italic">{i * 50}</span>
              </div>
            ))}
            
            {/* Top Guideline Markers */}
            {guidelinesX.map(x => (
              <div 
                key={x}
                className="absolute top-0 w-5 h-full bg-blue-500/10 flex items-center justify-center group/marker cursor-col-resize z-50"
                style={{ left: `${x - 10}px` }}
                onPointerDown={(e) => { e.stopPropagation(); setDraggingGuidelineX(x); }}
              >
                <div className="w-px h-full bg-blue-600 shadow-md ring-1 ring-blue-200" />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeGuidelineX(x); }}
                  className="absolute -top-3 hidden group-hover/marker:flex bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-xl"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Side Ruler */}
            <div 
              className="w-6 bg-gray-200 border-r border-gray-300 relative cursor-crosshair flex-shrink-0 overflow-hidden"
              onPointerDown={handleSideRulerClick}
              style={{ height: '100%' }}
            >
               {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 w-2 border-t border-gray-400 pointer-events-none" 
                  style={{ top: `${i * 50}px` }}
                >
                   <span className="absolute left-1 top-0 text-[7px] text-gray-400 font-mono italic">{i * 50}</span>
                </div>
              ))}

              {/* Side Guideline Markers */}
              {guidelinesY.map(y => (
                <div 
                  key={y}
                  className="absolute left-0 h-5 w-full bg-blue-500/10 flex flex-col items-center justify-center group/marker cursor-row-resize z-50"
                  style={{ top: `${y - 10}px` }}
                  onPointerDown={(e) => { e.stopPropagation(); setDraggingGuidelineY(y); }}
                >
                  <div className="h-px w-full bg-blue-600 shadow-md ring-1 ring-blue-200" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeGuidelineY(y); }}
                    className="absolute -left-3 hidden group-hover/marker:flex bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-xl"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>

            <div className="relative canvas-container">
              {/* Guidelines overlays X */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 overflow-hidden">
                {guidelinesX.map(x => (
                  <div 
                    key={x}
                    className="absolute top-0 h-full w-2 -ml-1 flex justify-center cursor-col-resize pointer-events-auto group/lineX"
                    style={{ left: `${x}px` }}
                    onPointerDown={(e) => { e.stopPropagation(); setDraggingGuidelineX(x); }}
                  >
                    <div className="w-[1px] h-full bg-blue-400/40 group-hover/lineX:bg-blue-600 transition-colors border-l border-dashed border-blue-400/40" />
                  </div>
                ))}
              </div>

              {/* Guidelines overlays Y */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 overflow-hidden">
                {guidelinesY.map(y => (
                  <div 
                    key={y}
                    className="absolute left-0 w-full h-2 -mt-1 flex flex-col items-center cursor-row-resize pointer-events-auto group/lineY"
                    style={{ top: `${y}px` }}
                    onPointerDown={(e) => { e.stopPropagation(); setDraggingGuidelineY(y); }}
                  >
                    <div className="h-[1px] w-full bg-blue-400/40 group-hover/lineY:bg-blue-600 transition-colors border-t border-dashed border-blue-400/40" />
                  </div>
                ))}
              </div>

              {/* A4 Paper background simulation container */}
              <div className="flex flex-col bg-gray-50">
                {bands.map((band) => (
                  band.visible && <Band key={band.id} band={band} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
