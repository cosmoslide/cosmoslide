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

  /**
   * PDF 파일의 첫 페이지를 320x260 jpg 썸네일로 변환
   * @param pdfBuffer PDF 파일 버퍼
   * @param originalName 원본 파일명
   * @returns 썸네일 파일 경로 및 버퍼
   */
  async generateThumbnail(pdfBuffer: Buffer, originalName: string): Promise<{ buffer: Buffer; filename: string }> {
    // 환경 변수에서 썸네일 크기 읽기 (기본값: 320x260)
    const width = parseInt(process.env.PRESENTATION_THUMB_WIDTH || '320', 10);
    const height = parseInt(process.env.PRESENTATION_THUMB_HEIGHT || '260', 10);

    // 임시 파일 경로 생성
    const tempId = uuidv4();
    const tempPdfPath = `/tmp/${tempId}.pdf`;
    const tempPngPath = `/tmp/${tempId}.png`;
    const thumbFilename = `${path.parse(originalName).name}-thumb.jpg`;

    // PDF 버퍼를 임시 파일로 저장
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // 첫 페이지를 PNG로 렌더링
    await this.poppler.pdfToCairo(tempPdfPath, tempPngPath.replace('.png', ''), {
      singleFile: true,
      firstPageToConvert: 1,
      lastPageToConvert: 1,
      pngFile: true,
    });

    // PNG를 읽어서 sharp로 리사이즈 및 JPG 변환
    const imageBuffer = await fs.readFile(tempPngPath);
    const thumbBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg()
      .toBuffer();

    // 임시 파일 삭제
    await fs.unlink(tempPdfPath);
    await fs.unlink(tempPngPath);

    return { buffer: thumbBuffer, filename: thumbFilename };
  }
}
