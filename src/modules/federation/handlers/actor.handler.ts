import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities';

@Injectable()
export class ActorHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async handleActor(ctx: any, handle: string) {
    const user = await this.userRepository.findOne({ where: { username: handle } });
    if (!user) return null;

    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
      ],
      id: user.actorId,
      type: user.isBot ? 'Service' : 'Person',
      preferredUsername: user.username,
      name: user.displayName,
      summary: user.bio,
      url: user.actorId,
      icon: user.avatarUrl ? {
        type: 'Image',
        mediaType: 'image/png',
        url: user.avatarUrl,
      } : undefined,
      image: user.headerUrl ? {
        type: 'Image',
        mediaType: 'image/png',
        url: user.headerUrl,
      } : undefined,
      inbox: user.inboxUrl,
      outbox: user.outboxUrl,
      followers: user.followersUrl,
      following: user.followingUrl,
      manuallyApprovesFollowers: user.isLocked,
      publicKey: user.publicKey ? {
        id: user.publicKey.id,
        owner: user.actorId,
        publicKeyPem: user.publicKey.publicKeyPem,
      } : undefined,
      endpoints: {
        sharedInbox: `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}/inbox`,
      },
    };
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