import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { ActorHandler } from './handlers/actor.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { ObjectDispatcherHandler } from './handlers/object-dispatcher.handler';
import { Federation } from '@fedify/fedify';

@Injectable()
export class FederationService implements OnModuleInit {
  private initialized = false;

  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
    private actorHandler: ActorHandler,
    private nodeInfoHandler: NodeInfoHandler,
    private objectDispatcherHandler: ObjectDispatcherHandler,
  ) {}

  async onModuleInit() {
    await this.initialize();
    this.initialized = true;
  }

  async initialize() {
    if (this.initialized) return;
    this.nodeInfoHandler.setup(this.federation);
    this.actorHandler.setup(this.federation);
    this.objectDispatcherHandler.setup(this.federation);

    console.log('Initializing FederationService...');

    // Register all federation handlers
    console.log(
      'actorHandler.handleActor:',
      typeof this.actorHandler.handleActor,
    );

    console.log('After registerHandlers call');
  }

  getFederation() {
    return this.federation;
  }
}
