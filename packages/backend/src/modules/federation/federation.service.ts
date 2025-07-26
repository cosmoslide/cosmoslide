import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { ActorHandler } from './handlers/actor.handler';
import { ActivityHandler } from './handlers/activity.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { WebFingerHandler } from './handlers/webfinger.handler';
import { Federation } from '@fedify/fedify';

@Injectable()
export class FederationService implements OnModuleInit {
  private initialized = false;

  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
    private actorHandler: ActorHandler,
    private activityHandler: ActivityHandler,
    private nodeInfoHandler: NodeInfoHandler,
    private webFingerHandler: WebFingerHandler,
  ) {}

  async onModuleInit() {
    await this.initialize();
    this.initialized = true;
  }

  async initialize() {
    if (this.initialized) return;
    this.nodeInfoHandler.setup(this.federation);
    this.actorHandler.setup(this.federation);

    console.log('Initializing FederationService...');

    // Register all federation handlers
    console.log(
      'actorHandler.handleActor:',
      typeof this.actorHandler.handleActor,
    );

    console.log('After registerHandlers call');

    // Setup WebFinger separately as it might need special handling
    await this.webFingerHandler.setup(this.federation);
  }

  getFederation() {
    return this.federation;
  }
}
