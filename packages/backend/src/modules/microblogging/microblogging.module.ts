import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicrobloggingController } from './microblogging.controller';
import { FollowService } from './services/follow.service';
import { Note, User, Actor, Follow } from '../../entities';
import { FederationModule } from '../federation/federation.module';
import { ActorService } from './services/actor.service';
import { NoteService } from './services/note.service';
import { SearchService } from './services/search.service';
import { TimelineService } from './services/timeline.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, User, Actor, Follow, TimelinePost]),
    FederationModule,
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
