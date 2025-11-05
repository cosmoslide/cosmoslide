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
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
// Import node-poppler using namespace import to avoid ESM/CJS interop issues
// Types may be missing; in that case PopplerModule will be typed as any
import * as PopplerModule from 'node-poppler';

@Injectable()
export class PresentationService {
  constructor(
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private uploadService: UploadService,
    private timelineService: TimelineService,
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

    // Create presentation record first to get the ID
    const presentation = this.presentationRepository.create({
      title,
      pdfKey: '', // Will be set after upload
      url: '', // Will be set after we have the ID
      userId,
    });

    await this.presentationRepository.save(presentation);

    // Upload PDF file with new path structure
    const { key, url: pdfUrl } = await this.uploadService.uploadPresentationPDF(
      presentation.id,
      file,
    );

    // Try to generate a PNG thumbnail (first page) and upload it as well
    let thumbnailUrl: string | null = null;
    // Ensure tmpDir is visible to the finally block for cleanup
    let tmpDir: string | undefined;
    try {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cosmoslide-'));
      const pdfTmpPath = path.join(tmpDir, `source-${Date.now()}.pdf`);

      const outPrefix = `thumb-${Date.now()}`;
      const outputPrefixPath = path.join(tmpDir, outPrefix);
      const expectedThumbPath = `${outputPrefixPath}.png`;

      // Write the uploaded PDF buffer to a temp file
      await fs.writeFile(pdfTmpPath, file.buffer);

      // Use poppler to render the first page to PNG
      const poppler = new PopplerModule.Poppler();
      await poppler.pdfToCairo(pdfTmpPath, outputPrefixPath, {
        firstPageToConvert: 1,
        lastPageToConvert: 1,
        singleFile: true,
        pngFile: true,
      } as any);

      // Read generated PNG
      const pngBuffer = await fs.readFile(expectedThumbPath);

      // Upload thumbnail using the new specialized method
      const thumbResult = await this.uploadService.uploadPresentationThumbnail(
        presentation.id,
        pngBuffer,
      );
      thumbnailUrl = thumbResult.url;
    } catch (err) {
      // Non-fatal: log and continue without thumbnail
      // eslint-disable-next-line no-console
      console.warn('Thumbnail generation failed:', err?.message || err);
    } finally {
      // Clean up temp files
      try {
        if (typeof tmpDir === 'string') {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      } catch (_) {}
    }

    // Update presentation record with pdfKey and URL
    const baseUrl =
      process.env.FEDERATION_PROTOCOL +
      '://' +
      process.env.FEDERATION_HANDLE_DOMAIN;
    const presentationUrl = `${baseUrl}/presentations/${presentation.id}`;

    presentation.pdfKey = key;
    presentation.url = presentationUrl;
    await this.presentationRepository.save(presentation);

    // Get actor for the user
    const actor = await this.actorRepository.findOne({
      where: { userId },
    });

    if (actor) {
      // Create Note with presentation
      const noteContent = `${title}<br><a href="${presentationUrl}">Detail View</a>`;
      const note = await this.timelineService.createNote(actor, {
        content: noteContent,
        visibility: 'public',
        attachments: [
          ...(thumbnailUrl
            ? [
                {
                  type: 'Image',
                  url: thumbnailUrl,
                  mediaType: 'image/png',
                  name: `${title} (thumbnail)`,
                },
              ]
            : []),
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
