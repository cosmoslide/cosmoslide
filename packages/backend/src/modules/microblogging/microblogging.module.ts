import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicrobloggingController } from './microblogging.controller';
import { FollowService } from './services/follow.service';
import { Note, User, Actor, Follow } from '../../entities';
import { FederationModule } from '../federation/federation.module';
import { ActorService } from './services/actor.service';
import { NoteService } from './services/note.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, User, Actor, Follow]),
    FederationModule,
  ],
  controllers: [MicrobloggingController],
  providers: [FollowService, ActorService, NoteService, SearchService],
  exports: [FollowService, ActorService, NoteService, SearchService],
})
export class MicrobloggingModule {}
