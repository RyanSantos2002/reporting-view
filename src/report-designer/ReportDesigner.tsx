import React, { useState, useRef } from 'react';
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  DragOverlay
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Eye, Download, Upload } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { PropertyPanel } from './components/PropertyPanel';
import { ReportPreview } from './components/ReportPreview';
import { useReportStore } from './store/useReportStore';

import type { ElementType, UIElement, ReportDefinition } from './types';

export interface ReportDesignerProps {
  initialReport?: ReportDefinition;
  dataFieldsSchema?: string[];
  onSave?: (report: ReportDefinition) => void;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({ 
  initialReport, 
  dataFieldsSchema, 
  onSave 
}) => {
  const { report, addElement, updateElementPosition, moveSelectedElements, setReport, setDataFields, resetReport } = useReportStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize store with props on mount or when props change
  React.useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
    } else {
      resetReport();
    }
    
    if (dataFieldsSchema) {
      setDataFields(dataFieldsSchema, []);
    }
  }, [initialReport, dataFieldsSchema, setReport, resetReport, setDataFields]);
  
  // State for DragOverlay
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ElementType | null>(null);
  const [activeElement, setActiveElement] = useState<UIElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, 
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    
    if (active.data.current?.isNew) {
      setActiveType(active.data.current.type as ElementType);
    } else if (active.data.current?.element) {
      setActiveElement(active.data.current.element);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    setActiveElement(null);

    const { active, over } = event;
    if (!over) return;
    
    const overData = over.data.current;
    const activeData = active.data.current;
    if (!overData || !activeData) return;
    
    const bandId = overData.bandId as string;

    if (activeData.isNew) {
      const type = activeData.type as ElementType;
      const dataField = activeData.dataField as string | undefined;
      // Posicionamento bruto. Ideal calcular o mouse no target.
      const x = 50; 
      const y = 20;
      addElement(type, bandId, x, y, dataField);
    } else if (activeData.element) {
      const element = activeData.element;
      const { selectedElementIds } = useReportStore.getState();
      
      // Se houver múltiplos elementos selecionados e o que puxamos com o mouse também é um deles, arrasta TODOS no array.
      if (selectedElementIds.length > 1 && selectedElementIds.includes(element.id)) {
        moveSelectedElements(event.delta.x, event.delta.y);
      } else {
        const newX = element.x + event.delta.x;
        const newY = element.y + event.delta.y;
        updateElementPosition(element.id, newX, newY, bandId);
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(report);
    } else {
      // Default: Download JSON if no onSave prop is provided
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", report.reportName + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.bands && json.elements) {
          setReport(json);
        } else {
          alert('Arquivo JSON Inválido. Não contém as propriedades base do Relatório.');
        }
      } catch {
        alert('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Preview renderer for the overlay ghost
  const renderDragOverlay = () => {
    if (activeType) {
      // It's a new item being dragged from Sidebar
      return (
        <div className="p-3 bg-white border-2 border-blue-500 rounded shadow-lg opacity-80 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-600">Novo {activeType}</span>
        </div>
      );
    }
    
    if (activeElement) {
      // It's an existing item being moved
      return (
        <div style={{
          width: activeElement.width,
          height: activeElement.height,
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: activeElement.properties.textAlign || 'left',
          fontSize: `${activeElement.properties.fontSize}px`,
          fontFamily: activeElement.properties.fontFamily,
        }}>
          {activeElement.type === 'Text' && activeElement.properties.text}
          {activeElement.type === 'DataField' && `[${activeElement.properties.dataField}]`}
          {activeElement.type === 'Line' && <div className="w-full h-0.5 bg-black" />}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex flex-col h-screen bg-white text-gray-900 font-sans overflow-hidden">
          
          <div className="h-14 bg-blue-700 text-white flex items-center justify-between px-6 shadow-md z-10">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-white text-blue-700 px-2 py-0.5 rounded text-sm tracking-widest font-black">RD</span>
              Report Designer
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Save Button */}
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors text-sm font-medium"
              >
                <Download size={16} />
                {onSave ? 'Salvar no Sistema' : 'Baixar Layout JSON'}
              </button>

              {/* Import JSON Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors text-sm font-medium"
              >
                <Upload size={16} />
                Carregar Layout
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />

              {/* Load Example Button */}
              <button 
                onClick={() => {
                  fetch('/meu_relatorio_exemplo.json')
                    .then(res => res.json())
                    .then(data => setReport(data))
                    .catch(() => alert('Erro: o JSON de exemplo precisa estar na pasta public. Crie src/public/meu_relatorio_exemplo.json ou use o botão de Carregar Layout.'));
                }}
                className="flex items-center gap-2 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors text-sm font-medium border border-blue-500 bg-blue-800"
              >
                📥 Exemplo Pronto
              </button>

              <div className="w-px h-6 bg-blue-500 mx-2" />

              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border border-blue-400"
              >
                <Eye size={18} />
                Preview
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <Workspace />
            <PropertyPanel />
          </div>
        </div>
        
        {/* Renderiza o fantasma do item sendo arrastado */}
        <DragOverlay dropAnimation={null}>
          {activeId ? renderDragOverlay() : null}
        </DragOverlay>

      </DndContext>

      {isPreviewOpen && <ReportPreview onClose={() => setIsPreviewOpen(false)} />}
    </>
  );
};
