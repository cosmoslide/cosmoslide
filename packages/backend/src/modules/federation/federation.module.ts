import { Module } from '@nestjs/common';
import { FederationService } from './federation.service';
import { ActorHandler } from './handlers/actor.handler';
import { ActivityHandler } from './handlers/activity.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { WebFingerHandler } from './handlers/webfinger.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Post } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  providers: [
    FederationService,
    ActorHandler,
    ActivityHandler,
    NodeInfoHandler,
    WebFingerHandler,
  ],
  exports: [FederationService],
})
export class FederationModule {
  // Remove OnModuleInit to prevent double initialization
  // Let FederationService handle its own initialization
}