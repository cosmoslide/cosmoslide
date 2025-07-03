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

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private actorSyncService: ActorSyncService,
  ) {
    // Dynamic import of Fedify modules
    this.initializeFedifyClasses();
  }

  private async initializeFedifyClasses() {
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = await importDynamic('@fedify/fedify');
    this.Person = fedifyModule.Person;
    this.Application = fedifyModule.Application;
    this.Image = fedifyModule.Image;
    this.CryptographicKey = fedifyModule.CryptographicKey;
  }

  async handleActor(ctx: any, handle: string) {
    const user = await this.userRepository.findOne({ where: { username: handle } });
    if (!user) return null;

    // Ensure Fedify classes are loaded
    if (!this.Person) {
      await this.initializeFedifyClasses();
    }

    // Ensure actor entity exists and is synced
    const actor = await this.actorSyncService.syncUserToActor(user);

    // Create Fedify actor data
    const actorData: any = {
      id: new URL(actor.actorId),
      preferredUsername: actor.preferredUsername,
      name: actor.name,
      summary: actor.summary,
      url: actor.url ? new URL(actor.url) : undefined,
      icon: actor.icon ? new this.Image({
        url: new URL(actor.icon.url),
        mediaType: actor.icon.mediaType,
      }) : undefined,
      image: actor.image ? new this.Image({
        url: new URL(actor.image.url),
        mediaType: actor.image.mediaType,
      }) : undefined,
      inbox: new URL(actor.inbox),
      outbox: new URL(actor.outbox),
      followers: new URL(actor.followersUrl),
      following: new URL(actor.followingUrl),
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
      publicKey: actor.publicKey ? new this.CryptographicKey({
        id: new URL(actor.publicKey.id),
        owner: new URL(actor.actorId),
        publicKey: actor.publicKey.publicKeyPem,
      }) : undefined,
      endpoints: {
        sharedInbox: actor.endpoints?.sharedInbox ? new URL(actor.endpoints.sharedInbox) : undefined,
      },
    };

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