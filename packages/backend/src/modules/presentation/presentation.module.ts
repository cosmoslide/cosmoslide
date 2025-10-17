import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { ThumbnailService } from './thumbnail.service';
import { Presentation } from '../../entities/presentation.entity';
import { Actor } from '../../entities/actor.entity';
import { UploadModule } from '../upload/upload.module';
import { MicrobloggingModule } from '../microblogging/microblogging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presentation, Actor]),
    UploadModule,
    MicrobloggingModule,
  ],
  controllers: [PresentationController],
  providers: [PresentationService, ThumbnailService],
  exports: [PresentationService],
})
export class PresentationModule {}
