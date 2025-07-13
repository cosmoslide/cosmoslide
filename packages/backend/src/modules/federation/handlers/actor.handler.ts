import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor } from '../../../entities';
import { ActorSyncService } from '../services/actor-sync.service';
import { Application, Image, Person, RequestContext } from '@fedify/fedify';

@Injectable()
export class ActorHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private actorSyncService: ActorSyncService,
  ) { }

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
      inbox: ctx.getInboxUri(handle),
      outbox: ctx.getOutboxUri(handle),
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
