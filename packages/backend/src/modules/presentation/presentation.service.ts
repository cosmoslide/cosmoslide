import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presentation } from '../../entities/presentation.entity';
import { Actor } from '../../entities/actor.entity';
import { UploadService } from '../upload/upload.service';
import { TimelineService } from '../microblogging/services/timeline.service';
import { ThumbnailService } from './thumbnail.service';

@Injectable()
export class PresentationService {
  constructor(
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private uploadService: UploadService,
    private timelineService: TimelineService,
    private thumbnailService: ThumbnailService,
  ) {}

  async create(
    file: Express.Multer.File,
    title: string,
    userId: string,
  ): Promise<Presentation> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!title || title.trim() === '') {
      throw new BadRequestException('Title is required');
    }

    // Upload PDF file
    const { key, url: pdfUrl } = await this.uploadService.uploadFile(file);
  
    // Generate thumbnail
    const { buffer: thumbBuffer, filename: thumbFilename } = await this.thumbnailService.generateThumbnail(file.buffer, file.originalname);

    // Generated thumbnail uploads
    const thumbFile = {
      ...file,
      buffer: thumbBuffer,
      originalname: thumbFilename,
      mimetype: 'image/jpeg',
    };
    const thumbUploadResult = await this.uploadService.uploadFile(thumbFile);
    const { key: thumbKey, url: thumbUrl } = thumbUploadResult;

    // Create presentation record
    const presentation = this.presentationRepository.create({
      title,
      pdfKey: key,
      thumbKey: thumbKey,
      thumbUrl: thumbUrl,
      url: '', // Will be set after we have the ID
      userId,
    });

    await this.presentationRepository.save(presentation);

    // Generate presentation URL
    const baseUrl =
      process.env.FEDERATION_PROTOCOL +
      '://' +
      process.env.FEDERATION_HANDLE_DOMAIN;
    const presentationUrl = `${baseUrl}/presentations/${presentation.id}`;

    // Update presentation with URL
    presentation.url = presentationUrl;
    await this.presentationRepository.save(presentation);

    // Get actor for the user
    const actor = await this.actorRepository.findOne({
      where: { userId },
    });

    if (actor) {
      // Create Note with presentation
      const noteContent = `${title} ${presentationUrl}`;
      const note = await this.timelineService.createNote(actor, {
        content: noteContent,
        visibility: 'public',
        attachments: [
          {
            type: 'Document',
            url: pdfUrl,
            mediaType: 'application/pdf',
            name: title,
          },
        ],
      });

      // Link note to presentation
      if (note) {
        presentation.noteId = note.id;
        await this.presentationRepository.save(presentation);
      }
    }

  return presentation;
  }

  async findById(id: string): Promise<Presentation> {
    const presentation = await this.presentationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }

    return presentation;
  }

  async findByUserId(userId: string): Promise<Presentation[]> {
    return this.presentationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const presentation = await this.findById(id);

    if (presentation.userId !== userId) {
      throw new BadRequestException(
        'You can only delete your own presentations',
      );
    }

    // Delete PDF file from S3
    await this.uploadService.deleteFile(presentation.pdfKey);

    // Delete presentation record
    await this.presentationRepository.remove(presentation);
  }
}
