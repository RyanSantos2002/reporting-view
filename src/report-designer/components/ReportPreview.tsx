import React from 'react';
import { useReportStore } from '../store/useReportStore';
import { mockData } from '../mockData';

// Função auxiliar para pegar valor de objeto aninhado (Ex: Cliente.Nome)
const getNestedValue = (obj: Record<string, unknown> | undefined, path: string): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((acc: Record<string, any> | any, part) => acc && acc[part], obj);
};

export const ReportPreview: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { report, previewData } = useReportStore();
  const dataToRender = previewData && previewData.length > 0 ? previewData : mockData;

  const renderBand = (bandId: string, dataContext?: Record<string, unknown>) => {
    const band = report.bands.find((b) => b.id === bandId);
    if (!band || !band.visible) return null;

    const elements = report.elements.filter((el) => el.bandId === bandId);

    return (
      <div 
        key={`${bandId}-${dataContext ? JSON.stringify(dataContext) : 'static'}`}
        style={{ height: band.height, position: 'relative', width: '100%', overflow: 'hidden' }}
        className="border-b border-gray-100 last:border-0"
      >
        {elements.map((el) => {
          let content: React.ReactNode | string = '';
          
          if (el.type === 'Text') {
            content = el.properties.text;
          } else if (el.type === 'DataField' && dataContext && el.properties.dataField) {
            content = (getNestedValue(dataContext, el.properties.dataField) as React.ReactNode) || '';
          } else if (el.type === 'Line') {
            content = <div style={{ 
              width: '100%', 
              height: `${el.properties.borderWidth || 1}px`, 
              backgroundColor: el.properties.borderColor || '#000',
              marginTop: `${el.height / 2}px`
            }} />;
          }

          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                fontSize: `${el.properties.fontSize}px`,
                fontFamily: el.properties.fontFamily,
                color: el.properties.color,
                fontWeight: el.properties.fontWeight,
                textAlign: (el.properties.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="w-full block overflow-hidden">{content}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex flex-col p-8">
      <div className="bg-white rounded-t shadow-lg flex justify-between items-center p-4 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold text-gray-800">Visualização do Relatório</h2>
        <div className="space-x-3">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
          >
            Imprimir PDF
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-8 print:p-0 print:bg-white">
        {/* A4 Paper Simulation - This is what gets printed */}
        <div 
          className="bg-white shadow-xl print:shadow-none"
          style={{ 
            width: `${report.pageWidth}px`, 
            minHeight: `${report.pageHeight}px`,
            // Oculta margens na hora da impressão real
          }}
        >
          {/* Header */}
          {renderBand('ReportHeader')}
          {renderBand('PageHeader')}

          {/* Details - Repete para cada linha da Fonte de Dados Real ou Mock */}
          {dataToRender.map((dataRow, idx) => (
            <React.Fragment key={`detail-${idx}`}>
              {renderBand('Detail', dataRow)}
            </React.Fragment>
          ))}

          {/* Footers */}
          {renderBand('PageFooter')}
          {renderBand('ReportFooter')}
        </div>
      </div>
    </div>
  );
};
