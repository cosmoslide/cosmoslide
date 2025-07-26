import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor, KeyPair, KeyAlgorithm } from '../../../entities';
import { ActorSyncService } from '../services/actor-sync.service';
import {
  Application,
  Federation,
  Image,
  importPkcs1,
  importSpki,
  Person,
  RequestContext,
} from '@fedify/fedify';

@Injectable()
export class ActorHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,
    private actorSyncService: ActorSyncService,
  ) {}

  async setup(federation: Federation<unknown>) {
    federation
      .setActorDispatcher('/actors/{handle}', this.handleActor.bind(this))
      .setKeyPairsDispatcher(this.handleKeyPairs.bind(this));

    federation.setFollowersDispatcher(
      '/actors/{handle}/followers',
      this.handleFollowers.bind(this),
    );

    federation.setFollowingDispatcher(
      '/actors/{handle}/following',
      this.handleFollowing.bind(this),
    );
  }

  async handleKeyPairs(ctx: RequestContext<unknown>, handle: string) {
    const user = await this.userRepository.findOne({
      where: { username: handle },
    });

    if (!user) {
      console.log('User not found for handle:', handle);
      return [];
    }

    // Load all active key pairs for the user
    const keyPairs = await this.keyPairRepository.find({
      where: {
        userId: user.id,
        isActive: true,
      },
      order: {
        algorithm: 'ASC', // RSA first, then Ed25519
        createdAt: 'ASC',
      },
    });

    if (keyPairs.length === 0) {
      console.log('No key pairs found for user:', handle);
      return [];
    }

    // Convert key pairs to Fedify format
    const fedifyKeyPairs = await Promise.all(
      keyPairs.map(async (keyPair) => {
        try {
          // Import public key - importSpki doesn't take algorithm parameter
          const publicKey = await importSpki(keyPair.publicKey);

          // Import private key - using importPkcs1PrivateKey for RSA keys
          // Note: Ed25519 keys might need different handling
          const privateKey = await importPkcs1(keyPair.privateKey);

          return {
            keyId: keyPair.keyId,
            publicKey,
            privateKey,
            algorithm: keyPair.algorithm,
          };
        } catch (error) {
          console.error(`Failed to import key pair ${keyPair.keyId}:`, error);
          return null;
        }
      }),
    );

    // Filter out any failed imports
    const validKeyPairs = fedifyKeyPairs.filter((kp) => kp !== null);

    console.log(
      `Returning ${validKeyPairs.length} key pairs for user ${handle}`,
    );
    return validKeyPairs;
  }

  async getPrimaryKeyPair(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Get the first active RSA key pair
    const keyPair = await this.keyPairRepository.findOne({
      where: {
        userId: user.id,
        algorithm: KeyAlgorithm.RSA,
        isActive: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return keyPair;
  }

  async handleActor(ctx: RequestContext<unknown>, handle: string) {
    const user = await this.userRepository.findOne({
      where: { username: handle },
    });
    if (!user) {
      console.log('User not found for handle:', handle);
      return null;
    }
    // Ensure actor entity exists and is synced
    const actor = await this.actorSyncService.syncUserToActor(user);

    // Create Fedify actor data using context methods for proper URI generation
    const actorData: any = {
      id: ctx.getActorUri(handle),
      preferredUsername: actor.preferredUsername,
      name: actor.name,
      summary: actor.summary,
      url: ctx.getActorUri(handle),
      // inbox: ctx.getInboxUri(handle),
      // outbox: ctx.getOutboxUri(handle),
      followers: ctx.getFollowersUri(handle),
      following: ctx.getFollowingUri(handle),
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
    };

    // Add optional icon if available
    if (actor.icon) {
      actorData.icon = new Image({
        url: new URL(actor.icon.url),
        mediaType: actor.icon.mediaType,
      });
    }

    // Return the appropriate Fedify Actor type
    let result;
    if (actor.type === 'Person') {
      result = new Person(actorData);
    } else if (actor.type === 'Application' || actor.type === 'Service') {
      result = new Application(actorData);
    } else {
      // Default to Person if type is unknown
      result = new Person(actorData);
    }

    return result;
  }

  async handleFollowers(ctx: RequestContext<unknown>, actorId: string) {
    // TODO: Implement followers collection
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actorId}/followers`,
      totalItems: 0,
      orderedItems: [],
    };
  }

  async handleFollowing(ctx: RequestContext<unknown>, actorId: string) {
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
