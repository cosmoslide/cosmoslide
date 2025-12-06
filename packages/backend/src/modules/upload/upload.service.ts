import { Injectable, BadRequestException } from '@nestjs/common';
import storage from '../../lib/uploader';

@Injectable()
export class UploadService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Sanitize filename to handle special characters and encoding issues
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || 'bin';
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase();

    const filename = `${timestamp}-${baseName || 'file'}.${ext}`;
    const key = `uploads/${filename}`;

    try {
      // Upload file to S3
      await storage.put(key, file.buffer);

      // Generate public URL or presigned URL
      const url = await storage.getUrl(key);

      return { key, url };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WebP images are allowed for profile images',
      );
    }

    // Generate safe filename with timestamp
    const timestamp = Date.now();
    // Extract extension safely, handling edge cases
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `avatar-${timestamp}.${ext}`;
    const key = `users/${userId}/profile-image/${filename}`;

    try {
      await storage.put(key, file.buffer);
      const url = await storage.getUrl(key);
      return { key, url };
    } catch (error) {
      throw new BadRequestException(
        `Profile image upload failed: ${error.message}`,
      );
    }
  }

  async uploadPresentationPDF(
    presentationId: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Sanitize filename to handle special characters and encoding issues
    const ext = file.originalname.split('.').pop() || 'pdf';
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase();

    const timestamp = Date.now();
    const filename = `${baseName || 'document'}-${timestamp}.${ext}`;
    const key = `presentations/${presentationId}/document/${filename}`;

    try {
      await storage.put(key, file.buffer);
      const url = await storage.getUrl(key);
      return { key, url };
    } catch (error) {
      throw new BadRequestException(
        `Presentation PDF upload failed: ${error.message}`,
      );
    }
  }

  async uploadPresentationThumbnail(
    presentationId: string,
    imageBuffer: Buffer,
  ): Promise<{ key: string; url: string }> {
    const key = `presentations/${presentationId}/thumbnail.jpg`;

    try {
      await storage.put(key, imageBuffer);
      const url = await storage.getUrl(key);
      return { key, url };
    } catch (error) {
      throw new BadRequestException(
        `Thumbnail upload failed: ${error.message}`,
      );
    }
  }

  async uploadPresentationPage(
    presentationId: string,
    pageNumber: number,
    imageBuffer: Buffer,
  ): Promise<{ key: string; url: string }> {
    const key = `presentations/${presentationId}/pages/page-${pageNumber}.jpg`;

    try {
      await storage.put(key, imageBuffer);
      const url = await storage.getUrl(key);
      return { key, url };
    } catch (error) {
      throw new BadRequestException(`Page upload failed: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await storage.delete(key);
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      const exists = await storage.exists(key);
      if (!exists) {
        throw new BadRequestException('File not found');
      }

      return await storage.getUrl(key);
    } catch (error) {
      throw new BadRequestException(`Failed to get file URL: ${error.message}`);
    }
  }

  async listFiles(prefix: string = 'uploads/'): Promise<string[]> {
    try {
      const files = await storage.list(prefix);
      return files.map((file) => file.key);
    } catch (error) {
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  async getFile(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      console.log('Getting file:', key);

      const exists = await storage.exists(key);
      console.log('File exists:', exists);

      if (!exists) {
        throw new BadRequestException('File not found in S3');
      }

      // Verify it's a PDF file
      const ext = key.split('.').pop()?.toLowerCase() || '';
      if (ext !== 'pdf') {
        throw new BadRequestException('Only PDF files are supported');
      }

      console.log('Downloading file from S3...');
      const buffer = await storage.get(key);
      console.log('File downloaded, size:', buffer.length, 'bytes');

      return { buffer, contentType: 'application/pdf' };
    } catch (error) {
      console.error('Error in getFile:', error);
      throw new BadRequestException(`Failed to get file: ${error.message}`);
    }
  }
}
