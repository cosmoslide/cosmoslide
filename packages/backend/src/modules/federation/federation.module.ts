import { Module } from '@nestjs/common';
import { FederationService } from './federation.service';
import { ActorHandler } from './handlers/actor.handler';
import { ActivityHandler } from './handlers/activity.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { WebFingerHandler } from './handlers/webfinger.handler';
import { ActorSyncService } from './services/actor-sync.service';
import { ActivityDeliveryService } from './services/activity-delivery.service';
import { ContextService } from './services/context.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Note, Actor, Follow, KeyPair } from '../../entities';
import { FollowService } from '../microblogging/services/follow.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Note, Actor, Follow, KeyPair])],
  providers: [
    FederationService,
    ActorHandler,
    ActivityHandler,
    NodeInfoHandler,
    WebFingerHandler,
    ActorSyncService,
    ActivityDeliveryService,
    ContextService,
    FollowService,
  ],
  exports: [
    FederationService,
    ActorSyncService,
    ActivityDeliveryService,
    ContextService,
  ],
})
export class FederationModule {
  // Remove OnModuleInit to prevent double initialization
  // Let FederationService handle its own initialization
}
