import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import {
  FEDIFY_FEDERATION,
  FEDIFY_HANDLER_SETUP,
  FedifyHandlerSetup,
} from '../../libs/fedify-nestjs';
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
    @Inject(FEDIFY_HANDLER_SETUP) private handlerSetup: FedifyHandlerSetup,
    private actorHandler: ActorHandler,
    private activityHandler: ActivityHandler,
    private nodeInfoHandler: NodeInfoHandler,
    private webFingerHandler: WebFingerHandler,
  ) { }

  async onModuleInit() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
  }

  async initialize() {
    console.log('Initializing FederationService...');
    console.log(
      'federation in service:',
      this.federation === this.handlerSetup['federation'],
    );

    // Register all federation handlers
    console.log('About to call handlerSetup.registerHandlers');
    console.log('handlerSetup object:', this.handlerSetup);
    console.log(
      'actorHandler.handleActor:',
      typeof this.actorHandler.handleActor,
    );

    this.handlerSetup.registerHandlers({
      actorDispatcher: this.actorHandler.handleActor.bind(this.actorHandler),
      inboxListeners: this.activityHandler.getInboxListeners(),
      outboxHandler: this.activityHandler.handleOutbox.bind(
        this.activityHandler,
      ),
      followersHandler: this.actorHandler.handleFollowers.bind(
        this.actorHandler,
      ),
      followingHandler: this.actorHandler.handleFollowing.bind(
        this.actorHandler,
      ),
      nodeInfoDispatcher: this.nodeInfoHandler.handleNodeInfo.bind(
        this.nodeInfoHandler,
      ),
    });

    console.log('After registerHandlers call');

    // Setup WebFinger separately as it might need special handling
    await this.webFingerHandler.setup(this.federation);

    // Debug: Log federation details
    console.log('Federation object:', this.federation);
    console.log(
      'Federation methods:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(this.federation)),
    );
  }

  getFederation() {
    return this.federation;
  }
}
