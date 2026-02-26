/* eslint-disable @typescript-eslint/no-explicit-any */
// src/report-designer/types/index.ts

export type ElementType = 'Text' | 'DataField' | 'Image' | 'Line' | 'Rectangle';
export type BandType = 'PageHeader' | 'ReportHeader' | 'Detail' | 'ReportFooter' | 'PageFooter';

// Define the properties of an individual element on the canvas
export interface UIElement {
  id: string; // Unique identifier (e.g., UUID)
  type: ElementType;
  bandId: string; // Which band it currently belongs to (can be dynamic)
  x: number; // X position relative to the band
  y: number; // Y position relative to the band
  width: number;
  height: number;
  
  // Custom properties based on the type
  properties: {
    text?: string; 
    dataField?: string; // e.g., 'Cliente.Nome'
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    [key: string]: any; 
  };
}

// Represents a horizontal section of the report
export interface ReportBand {
  id: string; // Changed to string to support "Header_1", "Header_2"
  type: BandType; // Keeps the logical type behavior
  name: string;
  height: number;
  visible: boolean;
}

// The entire report definition that gets saved/loaded
export interface ReportDefinition {
  reportName: string;
  pageWidth: number; // e.g., 794 for A4 in pixels at 96dpi
  pageHeight: number; // e.g., 1123 for A4
  bands: ReportBand[];
  elements: UIElement[];
}
