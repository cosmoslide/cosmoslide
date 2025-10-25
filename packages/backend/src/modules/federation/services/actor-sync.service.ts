import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor } from '../../../entities';

@Injectable()
export class ActorSyncService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
  ) {}

  async syncUserToActor(user: User): Promise<Actor> {
    // Check if actor already exists for this user
    let actor: Actor | null = await this.actorRepository.findOne({
      where: { userId: user.id },
      relations: ['user'],
    });

    const actorData = {
      preferredUsername: user.username,
      name: user.displayName,
      summary: user.bio,
      icon: user.avatarUrl
        ? {
            type: 'Image',
            mediaType: 'image/png',
            url: user.avatarUrl,
          }
        : undefined,
      image: user.headerUrl
        ? {
            type: 'Image',
            mediaType: 'image/png',
            url: user.headerUrl,
          }
        : undefined,
      // manuallyApprovesFollowers should only be set via privacy settings, not during sync
      sharedInbox: `${process.env.FEDERATION_PROTOCOL}://${process.env.FRONTEND_URL}/inbox`,
      type: user.isBot ? 'Service' : 'Person',
      domain: process.env.FRONTEND_URL || 'localhost',
      isLocal: true,
      userId: user.id,
      followersCount: user.followersCount,
      followingCount: user.followingsCount,
    };

    if (actor) {
      // Update existing actor
      actor = await this.actorRepository.save({
        ...actor,
        ...actorData,
        ...{
          iri: user.actorId,
          url: `${process.env.FRONTEND_URL}/@${user.username}`,
          actorId: user.actorId,
          inboxUrl: user.inboxUrl,
          outboxUrl: user.outboxUrl,
          followersUrl: user.followersUrl,
          followingUrl: user.followingUrl,
        },
      });
    } else {
      // Create new actor
      actor = this.actorRepository.create({
        ...actorData,
      });
      actor = await this.actorRepository.save(actor);

      const refreshedUser = (await this.userRepository.findOne({
        where: {
          id: user.id,
        },
        relations: ['actor'],
      })) as User;

      await this.actorRepository.update(actor.id, {
        url: `${process.env.FRONTEND_URL}/@${refreshedUser.username}`,
        iri: refreshedUser.actorId,
        actorId: refreshedUser.actorId,
        inboxUrl: refreshedUser.inboxUrl,
        outboxUrl: refreshedUser.outboxUrl,
        followersUrl: refreshedUser.followersUrl,
        followingUrl: refreshedUser.followingUrl,
      });
    }

    return actor;
  }

  async syncAllUsers(): Promise<void> {
    const users = await this.userRepository.find();
    for (const user of users) {
      await this.syncUserToActor(user);
    }
  }

  async getOrFetchActor(actorId: string): Promise<Actor | null> {
    // First check if we have this actor in our database
    const existingActor = await this.actorRepository.findOne({
      where: { actorId },
    });

    if (existingActor) {
      // If it's a local actor or recently fetched, return it
      if (existingActor.isLocal) {
        return existingActor;
      }

      // Check if we need to refresh remote actor data
      const lastFetch = existingActor.lastFetchedAt;
      const now = new Date();
      const hoursSinceLastFetch = lastFetch
        ? (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Refresh if older than 24 hours
      if (hoursSinceLastFetch < 24) {
        return existingActor;
      }
    }

    // TODO: Implement fetching remote actor data via ActivityPub
    // For now, return null if not found locally
    return null;
  }
}
