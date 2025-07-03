import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor } from '../../../entities';
import { ActorSyncService } from '../services/actor-sync.service';

@Injectable()
export class ActorHandler {
  private Person: any;
  private Application: any;
  private Image: any;
  private CryptographicKey: any;
  private Endpoints: any;

  private fedifyInitialized = false;
  private importSpki: any;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private actorSyncService: ActorSyncService,
  ) {}

  private async initializeFedifyClasses() {
    if (this.fedifyInitialized) return;
    
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = await importDynamic('@fedify/fedify');
    this.Person = fedifyModule.Person;
    this.Application = fedifyModule.Application;
    this.Image = fedifyModule.Image;
    this.CryptographicKey = fedifyModule.CryptographicKey;
    this.Endpoints = fedifyModule.Endpoints;
    this.importSpki = fedifyModule.importSpki;
    this.fedifyInitialized = true;
  }

  async handleActor(ctx: any, handle: string) {
    const user = await this.userRepository.findOne({ where: { username: handle } });
    if (!user) return null;

    // Ensure Fedify classes are loaded
    await this.initializeFedifyClasses();

    // Ensure actor entity exists and is synced
    const actor = await this.actorSyncService.syncUserToActor(user);

    // Get key pairs for the actor
    const keyPairs = await ctx.getActorKeyPairs(handle);
    
    // Create Fedify actor data using context methods for proper URI generation
    const actorData: any = {
      id: ctx.getActorUri(handle),
      preferredUsername: actor.preferredUsername,
      name: actor.name,
      summary: actor.summary,
      url: ctx.getActorUri(handle),
      inbox: ctx.getInboxUri(handle),
      outbox: ctx.getOutboxUri(handle),
      followers: ctx.getFollowersUri(handle),
      following: ctx.getFollowingUri(handle),
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
      // Use publicKeys (plural) as shown in the example
      publicKeys: keyPairs.map(keyPair => keyPair.cryptographicKey),
    };
    
    // Add optional icon if available
    if (actor.icon) {
      actorData.icon = new this.Image({
        url: new URL(actor.icon.url),
        mediaType: actor.icon.mediaType,
      });
    }

    // Return the appropriate Fedify Actor type
    if (actor.type === 'Person') {
      return new this.Person(actorData);
    } else if (actor.type === 'Application' || actor.type === 'Service') {
      return new this.Application(actorData);
    }
    
    // Default to Person if type is unknown
    return new this.Person(actorData);
  }

  async handleFollowers(ctx: any, actorId: string) {
    // TODO: Implement followers collection
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actorId}/followers`,
      totalItems: 0,
      orderedItems: [],
    };
  }

  async handleFollowing(ctx: any, actorId: string) {
    // TODO: Implement following collection
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actorId}/following`,
      totalItems: 0,
      orderedItems: [],
    };
  }
}