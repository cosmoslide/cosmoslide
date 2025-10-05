import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PresentationService } from './presentation.service';

@Controller('presentations')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '200') * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async createPresentation(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Request() req,
  ) {
    const presentation = await this.presentationService.create(
      file,
      title,
      req.user.id,
    );

    return {
      id: presentation.id,
      title: presentation.title,
      url: presentation.url,
      pdfKey: presentation.pdfKey,
      noteId: presentation.noteId,
      createdAt: presentation.createdAt,
    };
  }

  @Get(':id')
  async getPresentation(@Param('id') id: string) {
    const presentation = await this.presentationService.findById(id);

    return {
      id: presentation.id,
      title: presentation.title,
      url: presentation.url,
      pdfKey: presentation.pdfKey,
      noteId: presentation.noteId,
      userId: presentation.userId,
      createdAt: presentation.createdAt,
    };
  }

  @Get('user/:userId')
  async getUserPresentations(@Param('userId') userId: string) {
    const presentations = await this.presentationService.findByUserId(userId);
    return presentations.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      pdfKey: p.pdfKey,
      noteId: p.noteId,
      createdAt: p.createdAt,
    }));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePresentation(@Param('id') id: string, @Request() req) {
    await this.presentationService.delete(id, req.user.userId);
    return { message: 'Presentation deleted successfully' };
  }
}
