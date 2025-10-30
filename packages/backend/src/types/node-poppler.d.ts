declare module 'node-poppler' {
  export class Poppler {
    constructor(options?: any);
    pdfToCairo(
      inputFile: string,
      outputFilePrefix: string,
      options?: any
    ): Promise<void>;
  }
}
