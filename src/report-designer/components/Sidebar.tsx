import React from 'react';
import { Type, Database, Minus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { ElementType } from '../types';

interface SidebarItemProps {
  type: ElementType;
  icon: React.ReactNode;
  label: string;
  dataField?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ type, icon, label, dataField }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dataField ? `new-${type}-${dataField}` : `new-${type}`,
    data: {
      type,
      isNew: true,
      dataField,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 mb-2 rounded border bg-white cursor-grab 
        hover:border-blue-500 hover:shadow-sm transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="text-gray-500">{icon}</div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
};

import { useReportStore } from '../store/useReportStore';
import { Upload } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { dataFields, setDataFields } = useReportStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Extract keys from JSON. If it's an array, get keys from first object.
        const firstObj = Array.isArray(json) ? json[0] : json;
        const fullData = Array.isArray(json) ? json : [json];
        
        if (firstObj && typeof firstObj === 'object') {
          const keys = Object.keys(firstObj);
          if (keys.length > 0) {
            setDataFields(keys, fullData);
          } else {
            alert('JSON vazio. Não há campos para extrair.');
          }
        } else {
          alert('O JSON deve ser um Objeto ou um Array de Objetos.');
        }
      } catch {
        alert('Erro ao processar JSON: Verifique a formatação do arquivo.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Ferramentas</h2>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Elementos Básicos
        </h3>
        <SidebarItem type="Text" icon={<Type size={18} />} label="Texto Fixo" />
        <SidebarItem type="Line" icon={<Minus size={18} />} label="Linha" />
        
        <div className="mt-6 mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Dados Dinâmicos
          </h3>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-white bg-blue-500 hover:bg-blue-600 p-1 rounded transition-colors"
            title="Carregar JSON de Dados para listar campos"
          >
            <Upload size={14} />
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </div>

        {dataFields.length === 0 ? (
          <div className="text-xs text-gray-400 p-3 bg-white border border-dashed rounded text-center">
            Nenhum JSON de dados carregado.<br/>
            <button className="text-blue-500 hover:underline mt-1" onClick={() => fileInputRef.current?.click()}>
              Carregar Modelo
            </button>
          </div>
        ) : (
          dataFields.map(field => (
            <SidebarItem 
              key={field} 
              type="DataField" 
              icon={<Database size={18} />} 
              label={`[${field}]`} 
              dataField={field}
            />
          ))
        )}
      </div>
    </div>
  );
};
