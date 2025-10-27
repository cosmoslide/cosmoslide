import { Module } from '@nestjs/common';
import { FederationService } from './federation.service';
import { ActorHandler } from './handlers/actor.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { ActorSyncService } from './services/actor-sync.service';
import { ContextService } from './services/context.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Note, Actor, Follow, KeyPair } from '../../entities';
import { FollowService } from '../microblogging/services/follow.service';
import { NoteService } from '../microblogging/services/note.service';
import { ObjectDispatcherHandler } from './handlers/object-dispatcher.handler';
import { ActorService } from '../microblogging/services/actor.service';
import { TimelineService } from '../microblogging/services/timeline.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';
import { Mention } from 'src/entities/mention.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Note,
      Actor,
      Follow,
      KeyPair,
      TimelinePost,
      Mention,
    ]),
  ],
  providers: [
    FederationService,
    ActorHandler,
    NodeInfoHandler,
    ObjectDispatcherHandler,
    ActorSyncService,
    ContextService,
    FollowService,
    NoteService,
    ActorService,
    TimelineService,
  ],
  exports: [FederationService, ActorSyncService, ContextService],
})
export class FederationModule {
  // Remove OnModuleInit to prevent double initialization
  // Let FederationService handle its own initialization
}
