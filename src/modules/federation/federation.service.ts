import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { FEDIFY_FEDERATION, FEDIFY_HANDLER_SETUP, FedifyHandlerSetup } from 'fedify-nestjs';
import { ActorHandler } from './handlers/actor.handler';
import { ActivityHandler } from './handlers/activity.handler';
import { NodeInfoHandler } from './handlers/nodeinfo.handler';
import { WebFingerHandler } from './handlers/webfinger.handler';

@Injectable()
export class FederationService implements OnModuleInit {
  private initialized = false;

  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: any,
    @Inject(FEDIFY_HANDLER_SETUP) private handlerSetup: FedifyHandlerSetup,
    private actorHandler: ActorHandler,
    private activityHandler: ActivityHandler,
    private nodeInfoHandler: NodeInfoHandler,
    private webFingerHandler: WebFingerHandler,
  ) {}

  async onModuleInit() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
  }

  async initialize() {
    console.log('Initializing FederationService...');
    
    // Register all federation handlers
    this.handlerSetup.registerHandlers({
      actorDispatcher: this.actorHandler.handleActor.bind(this.actorHandler),
      inboxHandler: this.activityHandler.handleInbox.bind(this.activityHandler),
      outboxHandler: this.activityHandler.handleOutbox.bind(this.activityHandler),
      followersHandler: this.actorHandler.handleFollowers.bind(this.actorHandler),
      followingHandler: this.actorHandler.handleFollowing.bind(this.actorHandler),
      nodeInfoDispatcher: this.nodeInfoHandler.handleNodeInfo.bind(this.nodeInfoHandler),
    });

    // Setup WebFinger separately as it might need special handling
    await this.webFingerHandler.setup(this.federation);
    
    // Debug: Log federation routes
    console.log('Federation router:', this.federation.router);
    if (this.federation.router) {
      console.log('Federation routes:', JSON.stringify(this.federation.router.routes?.map((r: any) => r.path || r), null, 2));
    }
  }

  getFederation() {
    return this.federation;
  }
}