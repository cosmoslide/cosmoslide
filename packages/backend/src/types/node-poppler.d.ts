declare module 'node-poppler' {
  export interface PopplerOptions {
    binPath?: string;
  }

  export interface PdfToCairoOptions {
    firstPageToConvert?: number;
    lastPageToConvert?: number;
    singleFile?: boolean;
    pngFile?: boolean;
    jpegFile?: boolean;
    tiffFile?: boolean;
    pdfFile?: boolean;
    psFile?: boolean;
    epsFile?: boolean;
    svgFile?: boolean;
    resolution?: number;
    scalePageTo?: number;
    scalePageToX?: number;
    scalePageToY?: number;
    cropBox?: boolean;
    mono?: boolean;
    gray?: boolean;
    antialias?: 'default' | 'none' | 'gray' | 'subpixel' | 'fast' | 'good' | 'best';
  }

  export class Poppler {
    constructor(options?: PopplerOptions);
    pdfToCairo(
      inputFile: string,
      outputFilePrefix: string,
      options?: PdfToCairoOptions
    ): Promise<string>;
  }
}
