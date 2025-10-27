import { Application, Person, Service } from '@fedify/fedify';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'src/entities';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
  ) {}

  async persistActor(
    person: Person | Application | Service,
  ): Promise<Actor | null> {
    const actorId = person.id;

    if (!actorId) return null;

    const actorHref = actorId.href;
    if (!actorHref) return null;
    const iri = person.id.href;
    let actor = await this.actorRepository.findOne({
      where: [
        {
          iri,
        },
        { url: iri },
        { actorId: iri },
      ],
    });
    if (actor) {
      // [TODO]
      // Improve actor persistent logic with not yet handled properties
      // - remaining: published, following, followers, featured, featuredTags, published
      console.log({ person });
      const getterOptions = { suppressError: true };

      const icon = await person.getIcon(getterOptions);
      const featured = person.getFeatured(getterOptions);
      const featuredTags = person.getFeaturedTags(getterOptions);

      await this.actorRepository.update(actor.id, {
        name: person.name?.toString(),
        summary: person.summary?.toString(),
        manuallyApprovesFollowers: person.manuallyApprovesFollowers || false,
        icon: {
          url: icon?.url?.href?.toString(),
          mediaType: icon?.mediaType?.toString(),
        },
        lastFetchedAt: new Date(),
      });

      return actor;
    }

    // If actor is from remote
    const getterOptions = { suppressError: true };
    const following = await person.getFollowing(getterOptions);
    const followers = await person.getFollowers(getterOptions);

    actor = this.actorRepository.create({
      actorId: person.id.href,
      name: person.name?.toString(),
      summary: person.summary,
      preferredUsername: person.preferredUsername,
      bio: person.content,
      iri: iri,
      isLocal: false,
      url: person.url?.href,
      domain: actorId.origin,
      acct: `@${person.preferredUsername}@${actorId.hostname}`,
      type: 'Person',
      manuallyApprovesFollowers: person.manuallyApprovesFollowers || false,
      followingUrl: following?.url,
      followersUrl: followers?.url,
      inboxUrl: person.inboxId?.href,
      outboxUrl: person.outboxId?.href,
      sharedInboxUrl: person.endpoints?.sharedInbox,
    } as DeepPartial<Actor>);

    await this.actorRepository.save(actor);

    return actor;
  }

  async getActorByUserId(userId: string) {
    const actor = await this.actorRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    return actor;
  }

  async getActorByUsername(username: string) {
    // Handle both local (@username or username) and remote (@username@domain) users
    // Remove leading @ if present
    const cleanUsername = username.startsWith('@')
      ? username.substring(1)
      : username;

    // Check if it's a remote user (contains @)
    const isRemote = cleanUsername.includes('@');

    if (isRemote) {
      // For remote users, search by full acct (e.g., @username@domain)
      const actor = await this.actorRepository.findOne({
        where: { acct: `@${cleanUsername}` },
      });
      return actor;
    } else {
      // For local users, search by preferredUsername
      const actor = await this.actorRepository.findOne({
        where: { preferredUsername: cleanUsername, isLocal: true },
      });
      return actor;
    }
  }
}
