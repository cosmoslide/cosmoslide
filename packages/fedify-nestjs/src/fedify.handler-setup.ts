import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FEDIFY_FEDERATION } from './fedify.constants';

export interface FedifyHandlers {
  actorDispatcher?: (ctx: any, handle: string) => Promise<any>;
  inboxListeners?: {
    [activityType: string]: (ctx: any, activity: any) => Promise<void>;
  };
  outboxHandler?: (ctx: any, actor: string) => Promise<any>;
  followersHandler?: (ctx: any, actor: string) => Promise<any>;
  followingHandler?: (ctx: any, actor: string) => Promise<any>;
  nodeInfoDispatcher?: (ctx: any) => Promise<any>;
}

@Injectable()
export class FedifyHandlerSetup implements OnModuleInit {
  private handlers: FedifyHandlers = {};
  private isSetup = false;

  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: any,
    private moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // Handlers will be registered by services
  }

  registerHandlers(handlers: FedifyHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
    
    // Only setup handlers once
    if (!this.isSetup) {
      this.setupFederationHandlers();
      this.isSetup = true;
    }
  }

  private async setupFederationHandlers() {
    console.log('Setting up federation handlers...');
    
    if (this.handlers.actorDispatcher) {
      console.log('Setting up actor dispatcher');
      await this.setupActorDispatcher();
    }
    
    if (this.handlers.inboxListeners) {
      console.log('Setting up inbox listeners');
      await this.setupInboxHandler();
    }
    
    if (this.handlers.outboxHandler) {
      console.log('Setting up outbox handler');
      await this.setupOutboxHandler();
    }
    
    if (this.handlers.followersHandler) {
      console.log('Setting up followers handler');
      await this.setupFollowersHandler();
    }
    
    if (this.handlers.followingHandler) {
      console.log('Setting up following handler');
      await this.setupFollowingHandler();
    }
    
    if (this.handlers.nodeInfoDispatcher) {
      console.log('Setting up nodeinfo dispatcher');
      // Check if nodeinfo is already set up
      try {
        await this.setupNodeInfoDispatcher();
      } catch (error) {
        console.error('Failed to setup NodeInfo dispatcher:', error);
        // If it's already registered, we can continue
        if (!error.message.includes('is the same as other route')) {
          throw error;
        }
      }
    }
  }

  private async setupActorDispatcher() {
    this.federation.setActorDispatcher('/actors/{handle}', this.handlers.actorDispatcher!);
  }

  private async setupInboxHandler() {
    // setInboxListeners requires a path template and handler
    // The path should match the inbox URLs for actors
    let inbox = this.federation.setInboxListeners('/actors/{handle}/inbox', '/inbox');
    
    // Register all activity type handlers from inboxListeners object
    if (this.handlers.inboxListeners) {
      for (const [activityType, handler] of Object.entries(this.handlers.inboxListeners)) {
        console.log(`Registering inbox listener for ${activityType}`);
        inbox = inbox.on(activityType, handler);
      }
    }
  }

  private async setupOutboxHandler() {
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = await importDynamic('@fedify/fedify');
    const { OrderedCollection } = fedifyModule;

    this.federation.setOutboxDispatcher('/actors/{handle}/outbox', async (ctx: any, actor: any) => {
      const outboxData = await this.handlers.outboxHandler!(ctx, actor.id?.href || actor.id);
      return new OrderedCollection(outboxData);
    });
  }

  private async setupFollowersHandler() {
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = await importDynamic('@fedify/fedify');
    const { OrderedCollection } = fedifyModule;

    this.federation.setFollowersDispatcher('/actors/{handle}/followers', async (ctx: any, actor: any) => {
      const followersData = await this.handlers.followersHandler!(ctx, actor.id?.href || actor.id);
      return new OrderedCollection(followersData);
    });
  }

  private async setupFollowingHandler() {
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = await importDynamic('@fedify/fedify');
    const { OrderedCollection } = fedifyModule;

    this.federation.setFollowingDispatcher('/actors/{handle}/following', async (ctx: any, actor: any) => {
      const followingData = await this.handlers.followingHandler!(ctx, actor.id?.href || actor.id);
      return new OrderedCollection(followingData);
    });
  }

  private async setupNodeInfoDispatcher() {
    console.log('Attempting to set up NodeInfo dispatcher...');
    
    try {
      // Set up NodeInfo dispatcher with specific version path
      this.federation.setNodeInfoDispatcher('/nodeinfo/2.1', async (ctx: any) => {
        return await this.handlers.nodeInfoDispatcher!(ctx);
      });
      
      console.log('NodeInfo dispatcher set successfully');
    } catch (error) {
      console.error('Error setting up NodeInfo:', error);
      // Don't throw if it's already configured
      if (!error.message?.includes('is the same as other route')) {
        throw error;
      }
    }
  }
}