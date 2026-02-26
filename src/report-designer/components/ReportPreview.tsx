import React from 'react';
import { Eye } from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col p-4 md:p-12 animate-in fade-in duration-300">
      <div className="bg-white/90 backdrop-blur-md rounded-t-2xl shadow-2xl flex justify-between items-center p-6 max-w-5xl mx-auto w-full border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg">
            <Eye size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Visualização do Relatório</h2>
            <p className="text-xs text-gray-400 font-medium">Layout: {report.reportName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            Imprimir PDF
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold text-sm transition-all flex items-center gap-2"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 flex justify-center p-8 print:p-0 print:bg-white custom-scrollbar rounded-b-2xl max-w-5xl mx-auto w-full shadow-2xl overflow-x-hidden border-x border-b border-gray-50">
        {/* A4 Paper Simulation - This is what gets printed */}
        <div 
          className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] origin-top print:shadow-none mb-12"
          style={{ 
            width: `${report.pageWidth}px`, 
            minHeight: `${report.pageHeight}px`,
          }}
        >
          {/* Header */}
          {renderBand('ReportHeader')}
          {renderBand('PageHeader')}

          {/* Details - Repete para cada linha da Fonte de Dados Real ou Mock */}
          <div className="flex flex-col">
            {dataToRender.map((dataRow, idx) => (
              <React.Fragment key={`detail-${idx}`}>
                {renderBand('Detail', dataRow)}
              </React.Fragment>
            ))}
          </div>

          {/* Footers */}
          {renderBand('PageFooter')}
          {renderBand('ReportFooter')}
        </div>
      </div>
    </div>
  );
};
