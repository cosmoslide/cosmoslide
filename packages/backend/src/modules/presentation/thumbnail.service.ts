import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as Poppler from 'node-poppler';
import sharp from 'sharp';

@Injectable()
export class ThumbnailService {
  private poppler: Poppler.Poppler;

  constructor() {
  this.poppler = new Poppler.Poppler('/usr/bin');
  }

  async generateThumbnail(pdfBuffer: Buffer, originalName: string): Promise<{ buffer: Buffer; filename: string }> {
    const width = parseInt(process.env.PRESENTATION_THUMB_WIDTH || '320', 10);
    const height = parseInt(process.env.PRESENTATION_THUMB_HEIGHT || '260', 10);

    const tempId = uuidv4();
    const tempPdfPath = `/tmp/${tempId}.pdf`;
    const tempPngPath = `/tmp/${tempId}.png`;
    const thumbFilename = `${path.parse(originalName).name}-thumb.jpg`;

    await fs.writeFile(tempPdfPath, pdfBuffer);

    await this.poppler.pdfToCairo(tempPdfPath, tempPngPath.replace('.png', ''), {
      singleFile: true,
      firstPageToConvert: 1,
      lastPageToConvert: 1,
      pngFile: true,
    });

    const imageBuffer = await fs.readFile(tempPngPath);
    const thumbBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg()
      .toBuffer();

    await fs.unlink(tempPdfPath);
    await fs.unlink(tempPngPath);

    return { buffer: thumbBuffer, filename: thumbFilename };
  }
}
