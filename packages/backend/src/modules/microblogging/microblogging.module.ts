import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicrobloggingController } from './microblogging.controller';
import { FollowService } from './services/follow.service';
import { Note, User, Actor, Follow } from '../../entities';
import { Tag } from 'src/entities/tag.entity';
import { FederationModule } from '../federation/federation.module';
import { ActorService } from './services/actor.service';
import { NoteService } from './services/note.service';
import { SearchService } from './services/search.service';
import { TimelineService } from './services/timeline.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';
import { Mention } from 'src/entities/mention.entity';

@Module({
  imports: [
    FederationModule,
    TypeOrmModule.forFeature([
      Note,
      User,
      Actor,
      Follow,
      TimelinePost,
      Mention,
      Tag,
    ]),
  ],
  controllers: [MicrobloggingController],
  providers: [
    FollowService,
    ActorService,
    NoteService,
    SearchService,
    TimelineService,
  ],
  exports: [
    FollowService,
    ActorService,
    NoteService,
    SearchService,
    TimelineService,
  ],
})
export class MicrobloggingModule {}
