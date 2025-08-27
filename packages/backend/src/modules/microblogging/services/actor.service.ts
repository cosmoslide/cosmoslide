import { Person } from '@fedify/fedify';
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

  async persistActor(person: Person): Promise<Actor | null> {
    const actorId = person.id;
    if (!actorId) return null;

    const actorHref = actorId.href;
    if (!actorHref) return null;
    const iri = person.id.href;
    let actor = await this.actorRepository.findOne({
      where: {
        iri,
      },
    });
    if (actor) return actor;

    // If actor is from remote
    const following = await person.getFollowing();
    const followers = await person.getFollowers();

    actor = this.actorRepository.create({
      actorId: person.id.href,
      name: person.name,
      summary: person.summary,
      preferredUsername: person.preferredUsername,
      bio: person.content,
      iri: iri,
      isLocal: false,
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
    const actor = await this.actorRepository.findOne({
      where: [{ preferredUsername: username }, { acct: username }],
    });

    return actor;
  }
}
