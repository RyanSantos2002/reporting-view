import React from 'react';
import { useReportStore } from '../store/useReportStore';

export const PropertyPanel: React.FC = () => {
  const { report, selectedElementIds, updateElementProperties, updateElementSize, removeElement, alignSelectedElements } = useReportStore();

  const selectedElements = report.elements.filter(el => selectedElementIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  if (selectedElements.length === 0) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 text-center text-gray-500">
        Selecione um elemento para ver as propriedades.
      </div>
    );
  }

  // Multi-Selection Panel
  if (selectedElements.length > 1) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Múltiplos Itens ({selectedElements.length})</h2>
          <button 
            onClick={() => {
              selectedElements.forEach(el => removeElement(el.id));
            }}
            className="text-red-500 hover:text-red-700 text-sm font-medium p-1 rounded hover:bg-red-50"
          >
            Excluir Todos
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 block">Alinhamento Múltiplo</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => alignSelectedElements('left')}
                className="bg-gray-100 p-2 text-sm font-medium hover:bg-gray-200 rounded border border-gray-200"
              >
                Esquerda
              </button>
              <button 
                onClick={() => alignSelectedElements('right')}
                className="bg-gray-100 p-2 text-sm font-medium hover:bg-gray-200 rounded border border-gray-200"
              >
                Direita
              </button>
              <button 
                onClick={() => alignSelectedElements('top')}
                className="bg-gray-100 p-2 text-sm font-medium hover:bg-gray-200 rounded border border-gray-200"
              >
                Topo
              </button>
              <button 
                onClick={() => alignSelectedElements('bottom')}
                className="bg-gray-100 p-2 text-sm font-medium hover:bg-gray-200 rounded border border-gray-200"
              >
                Base
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Seleciona a extremidade mais distante do grupo.</p>
          </div>
        </div>
      </div>
    );
  }

  // Single Selection Panel (Fallback)
  if (!selectedElement) return null;



  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Propriedades</h2>
        <button 
          onClick={() => removeElement(selectedElement.id)}
          className="text-red-500 hover:text-red-700 text-sm font-medium p-1 rounded hover:bg-red-50"
        >
          Excluir
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        
        {/* Basic Info */}
        <div className="text-xs text-gray-400 mb-4 font-mono">
          ID: {selectedElement.id.split('-')[0]}<br/>
          Type: {selectedElement.type}
        </div>

        {/* Text / Data Field Content */}
        {(selectedElement.type === 'Text' || selectedElement.type === 'DataField') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedElement.type === 'Text' ? 'Texto' : 'Campo de Origem'}
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedElement.type === 'Text' 
                ? (selectedElement.properties.text || '') 
                : (selectedElement.properties.dataField || '')}
              onChange={(e) => updateElementProperties(selectedElement.id, { 
                [selectedElement.type === 'Text' ? 'text' : 'dataField']: e.target.value 
              })}
            />
          </div>
        )}

        {/* Dimension & Position Info (All types) */}
        <div className="grid grid-cols-2 gap-2 pb-4 border-b border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">X (esq)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              value={selectedElement.x}
              onChange={(e) => useReportStore.getState().updateElementPosition(selectedElement.id, parseInt(e.target.value) || 0, selectedElement.y, selectedElement.bandId)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Y (topo)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              value={selectedElement.y}
              onChange={(e) => useReportStore.getState().updateElementPosition(selectedElement.id, selectedElement.x, parseInt(e.target.value) || 0, selectedElement.bandId)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Largura</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              value={selectedElement.width}
              onChange={(e) => updateElementSize(selectedElement.id, parseInt(e.target.value) || 10, selectedElement.height)}
            /> {/* Precisaremos adicionar updateElementSize no Store depois, usando direct mutation provisoriamente para o React reagir se possível ou criar a action. */}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              value={selectedElement.height}
              onChange={(e) => updateElementSize(selectedElement.id, selectedElement.width, parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        {/* Line Properties */}
        {selectedElement.type === 'Line' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espessura (px)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={selectedElement.properties.borderWidth || 1}
                  onChange={(e) => updateElementProperties(selectedElement.id, { borderWidth: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Linha</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                    value={selectedElement.properties.borderColor || '#000000'}
                    onChange={(e) => updateElementProperties(selectedElement.id, { borderColor: e.target.value })}
                  />
                  <span className="text-sm font-mono text-gray-600">{selectedElement.properties.borderColor || '#000000'}</span>
                </div>
              </div>
            </div>
          </>
        )}


        {/* Font Properties */}
        {(selectedElement.type === 'Text' || selectedElement.type === 'DataField') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (px)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={selectedElement.properties.fontSize || 12}
                  onChange={(e) => updateElementProperties(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso da Fonte</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                  value={selectedElement.properties.fontWeight || 'normal'}
                  onChange={(e) => updateElementProperties(selectedElement.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select 
                className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                value={selectedElement.properties.fontFamily || 'Arial'}
                onChange={(e) => updateElementProperties(selectedElement.id, { fontFamily: e.target.value })}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alinhamento</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                  value={selectedElement.properties.textAlign || 'left'}
                  onChange={(e) => updateElementProperties(selectedElement.id, { textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify' })}
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                  <option value="justify">Justificado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Fonte</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                    value={selectedElement.properties.color || '#000000'}
                    onChange={(e) => updateElementProperties(selectedElement.id, { color: e.target.value })}
                  />
                  <span className="text-sm font-mono text-gray-600">{selectedElement.properties.color || '#000000'}</span>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
