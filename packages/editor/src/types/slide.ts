/** Slide dimensions in pixels (rendered at 96 DPI) */
export interface SlideDimensions {
  width: number;
  height: number;
}

/** Preset slide dimension options */
export interface SlidePreset {
  label: string;
  dimensions: SlideDimensions;
}

/** Base properties shared by all slide elements */
export interface BaseElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type SlideElementType = 'text';

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

/** Union of all element types (extend as more are added) */
export type SlideElement = TextElement;

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  sortOrder: number;
}

export interface Presentation {
  id: string;
  title: string;
  dimensions: SlideDimensions;
  slides: Slide[];
}

/** Dimension presets */
export const SLIDE_PRESETS: SlidePreset[] = [
  { label: 'Slide 16:9', dimensions: { width: 960, height: 540 } },
  { label: 'Slide 4:3', dimensions: { width: 960, height: 720 } },
  { label: 'A4 Landscape', dimensions: { width: 1123, height: 794 } },
];

export const DEFAULT_DIMENSIONS: SlideDimensions = { width: 960, height: 540 };
