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
    });

    const actorData = {
      actorId: user.actorId,
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
      followersUrl: user.followersUrl,
      followingUrl: user.followingUrl,
      manuallyApprovesFollowers: user.isLocked,
      publicKey: user.publicKey,
      endpoints: {
        sharedInbox: `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}/inbox`,
      },
      type: user.isBot ? 'Service' : 'Person',
      domain: process.env.FEDERATION_DOMAIN || 'localhost',
      isLocal: true,
      userId: user.id,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
    };

    if (actor) {
      // Update existing actor
      actor = await this.actorRepository.save({
        ...actor,
        ...actorData,
      });
    } else {
      // Create new actor
      actor = this.actorRepository.create(actorData);
      actor = await this.actorRepository.save(actor);
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