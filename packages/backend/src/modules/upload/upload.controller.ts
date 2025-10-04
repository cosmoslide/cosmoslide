import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '200') * 1024 * 1024, // Default 200MB
      },
      fileFilter: (req, file, cb) => {
        // Only allow PDF files
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadFile(file);
    return {
      success: true,
      message: 'PDF uploaded successfully',
      ...result,
    };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async listFiles() {
    const files = await this.uploadService.listFiles();
    return {
      success: true,
      files,
    };
  }

  @Get('view/*path')
  async streamFile(@Param('path') path: string | string[], @Res() res: Response) {
    try {
      // NestJS wildcard routes return path as array, convert to string
      const filePath = Array.isArray(path) ? path.join('/') : path;

      const { buffer, contentType } = await this.uploadService.getFile(filePath);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.send(buffer);
    } catch (error) {
      throw new BadRequestException(`Failed to get file: ${error.message}`);
    }
  }

  @Get('file/*path')
  @UseGuards(JwtAuthGuard)
  async getFileUrl(@Param('path') path: string | string[]) {
    // NestJS wildcard routes return path as array, convert to string
    const filePath = Array.isArray(path) ? path.join('/') : path;

    const url = await this.uploadService.getFileUrl(filePath);
    return {
      success: true,
      url,
    };
  }

  @Delete('file/*path')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('path') path: string | string[]) {
    // NestJS wildcard routes return path as array, convert to string
    const filePath = Array.isArray(path) ? path.join('/') : path;

    await this.uploadService.deleteFile(filePath);
    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
