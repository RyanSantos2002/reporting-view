import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ElementType, ReportBand, ReportDefinition, UIElement, BandType } from '../types';

interface ReportState {
  report: ReportDefinition;
  selectedElementIds: string[];
  dataFields: string[];
  guidelinesX: number[];
  guidelinesY: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewData: Record<string, any>[] | null;
  // Actions
  addElement: (type: ElementType, bandId: string, x: number, y: number, dataField?: string) => void;
  updateElementPosition: (id: string, x: number, y: number, bandId?: string) => void;
  moveSelectedElements: (deltaX: number, deltaY: number) => void;
  updateElementSize: (id: string, width: number, height: number) => void;
  updateElementProperties: (id: string, properties: Partial<UIElement['properties']>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  alignSelectedElements: (alignment: 'left' | 'right' | 'top' | 'bottom') => void;
  updateBandHeight: (bandId: string, height: number) => void;
  addBand: (type: BandType) => void;
  removeBand: (id: string) => void;
  resetReport: () => void;
  setReport: (report: ReportDefinition) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDataFields: (fields: string[], data: Record<string, any>[]) => void;
  addGuidelineX: (x: number) => void;
  removeGuidelineX: (x: number) => void;
  updateGuidelineX: (oldX: number, newX: number) => void;
  addGuidelineY: (y: number) => void;
  removeGuidelineY: (y: number) => void;
  updateGuidelineY: (oldY: number, newY: number) => void;
  toggleBandVisibility: (bandId: string) => void;
}

const initialBands: ReportBand[] = [
  { id: 'ReportHeader', type: 'ReportHeader', name: 'Report Header', height: 100, visible: false },
  { id: 'PageHeader', type: 'PageHeader', name: 'Page Header', height: 80, visible: false },
  { id: 'Detail', type: 'Detail', name: 'Detail', height: 200, visible: true },
  { id: 'PageFooter', type: 'PageFooter', name: 'Page Footer', height: 50, visible: false },
  { id: 'ReportFooter', type: 'ReportFooter', name: 'Report Footer', height: 80, visible: false },
];

export const useReportStore = create<ReportState>((set) => ({
  report: {
    reportName: 'Novo Relatório Customizado',
    pageWidth: 794, // A4 Width at 96 DPI
    pageHeight: 1123, // A4 Height at 96 DPI
    bands: initialBands,
    elements: [],
  },
  selectedElementIds: [],
  dataFields: [], // Campos dinâmicos carregados
  guidelinesX: [],
  guidelinesY: [],
  previewData: null, // Guardará os dados do JSON lido

  addElement: (type, bandId, x, y, dataField) =>
    set((state) => {
      const newElement: UIElement = {
        id: uuidv4(),
        type,
        bandId,
        x,
        y,
        width: type === 'Line' ? 100 : 150,
        height: type === 'Text' || type === 'DataField' ? 30 : 50,
        properties: {
          text: type === 'Text' ? 'Novo Texto' : undefined,
          dataField: type === 'DataField' ? (dataField || 'Selecione um campo') : undefined,
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#000000',
        },
      };

      return {
        report: { ...state.report, elements: [...state.report.elements, newElement] },
        selectedElementIds: [newElement.id], // Auto select upon creation
      };
    }),

  updateElementPosition: (id, x, y, bandId) =>
    set((state) => ({
      report: {
        ...state.report,
        elements: state.report.elements.map((el) =>
          el.id === id ? { ...el, x, y, bandId: bandId || el.bandId } : el
        ),
      },
    })),

  moveSelectedElements: (deltaX, deltaY) => set((state) => {
    if (state.selectedElementIds.length === 0) return state;

    return {
      report: {
        ...state.report,
        elements: state.report.elements.map(el => {
          if (!state.selectedElementIds.includes(el.id)) return el;
          return { ...el, x: el.x + deltaX, y: el.y + deltaY };
        })
      }
    };
  }),

  updateElementProperties: (id, properties) =>
    set((state) => ({
      report: {
        ...state.report,
        elements: state.report.elements.map((el) => {
          // If updating an element that is part of a multiple selection, update ALL selected! (Optional but good UX)
          if (state.selectedElementIds.includes(id)) {
             return state.selectedElementIds.includes(el.id) ? { ...el, properties: { ...el.properties, ...properties } } : el;
          }
          // Otherwise standard update
          return el.id === id ? { ...el, properties: { ...el.properties, ...properties } } : el;
        }),
      },
    })),

  updateElementSize: (id: string, width: number, height: number) =>
    set((state) => ({
      report: {
        ...state.report,
        elements: state.report.elements.map((el) =>
          el.id === id ? { ...el, width, height } : el
        ),
      },
    })),

  removeElement: (id) =>
    set((state) => ({
      report: {
        ...state.report,
        elements: state.report.elements.filter((el) => el.id !== id),
      },
      selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id),
    })),

  selectElement: (id, multiSelect = false) => set((state) => {
    if (multiSelect) {
      const isAlreadySelected = state.selectedElementIds.includes(id);
      return { 
        selectedElementIds: isAlreadySelected 
          ? state.selectedElementIds.filter(selectedId => selectedId !== id)
          : [...state.selectedElementIds, id] 
      };
    }
    return { selectedElementIds: [id] };
  }),

  clearSelection: () => set({ selectedElementIds: [] }),

  alignSelectedElements: (alignment) => set((state) => {
    if (state.selectedElementIds.length < 2) return state;

    const selectedEls = state.report.elements.filter(el => state.selectedElementIds.includes(el.id));
    
    // Find min/max anchors based on alignment type
    let anchorPos = 0;
    if (alignment === 'left') {
      anchorPos = Math.min(...selectedEls.map(el => el.x));
    } else if (alignment === 'right') {
      anchorPos = Math.max(...selectedEls.map(el => el.x + el.width));
    } else if (alignment === 'top') {
      anchorPos = Math.min(...selectedEls.map(el => el.y));
    } else if (alignment === 'bottom') {
      anchorPos = Math.max(...selectedEls.map(el => el.y + el.height));
    }

    return {
      report: {
        ...state.report,
        elements: state.report.elements.map(el => {
          if (!state.selectedElementIds.includes(el.id)) return el;

          if (alignment === 'left') return { ...el, x: anchorPos };
          if (alignment === 'right') return { ...el, x: anchorPos - el.width };
          if (alignment === 'top') return { ...el, y: anchorPos };
          if (alignment === 'bottom') return { ...el, y: anchorPos - el.height };
          
          return el;
        })
      }
    };
  }),

  updateBandHeight: (bandId, height) =>
    set((state) => ({
      report: {
        ...state.report,
        bands: state.report.bands.map((band) =>
          band.id === bandId ? { ...band, height } : band
        ),
      },
    })),

  addBand: (type) =>
    set((state) => {
      const newId = `${type}_${uuidv4().substring(0, 6)}`;
      const newBand: ReportBand = {
        id: newId,
        type,
        name: `${type} Custom`,
        height: 100,
        visible: true,
      };
      
      return {
        report: {
          ...state.report,
          bands: [...state.report.bands, newBand],
        },
      };
    }),

  removeBand: (id) =>
    set((state) => ({
      report: {
        ...state.report,
        bands: state.report.bands.filter((band) => band.id !== id),
        elements: state.report.elements.filter((el) => el.bandId !== id),
      },
    })),

  resetReport: () => set({
    report: {
      reportName: 'Novo Relatório Customizado',
      pageWidth: 794,
      pageHeight: 1123,
      bands: initialBands,
      elements: [],
    },
    selectedElementIds: [],
    dataFields: [],
    guidelinesX: [],
    guidelinesY: [],
    previewData: null,
  }),

  setReport: (report) => set({ report, selectedElementIds: [] }),

  setDataFields: (fields, data) => set({ dataFields: fields, previewData: data }),

  addGuidelineX: (x) => set((state) => {
    if (state.guidelinesX.some(g => Math.abs(g - x) < 3)) return state;
    return { guidelinesX: [...state.guidelinesX, x].sort((a,b) => a - b) };
  }),

  removeGuidelineX: (x) => set((state) => ({ 
    guidelinesX: state.guidelinesX.filter(g => g !== x) 
  })),

  updateGuidelineX: (oldX, newX) => set((state) => {
    // If we're dragging over another guideline, avoid merge unless it's a final state
    return {
      guidelinesX: state.guidelinesX.map(g => g === oldX ? newX : g).sort((a,b) => a - b)
    };
  }),

  addGuidelineY: (y) => set((state) => {
    if (state.guidelinesY.some(g => Math.abs(g - y) * 1 < 3)) return state;
    return { guidelinesY: [...state.guidelinesY, y].sort((a,b) => a - b) };
  }),

  removeGuidelineY: (y) => set((state) => ({ 
    guidelinesY: state.guidelinesY.filter(g => g !== y) 
  })),

  updateGuidelineY: (oldY, newY) => set((state) => ({
    guidelinesY: state.guidelinesY.map(g => g === oldY ? newY : g).sort((a,b) => a - b)
  })),

  toggleBandVisibility: (bandId) => set((state) => ({
    report: {
      ...state.report,
      bands: state.report.bands.map(b => b.id === bandId ? { ...b, visible: !b.visible } : b)
    }
  })),
}));
