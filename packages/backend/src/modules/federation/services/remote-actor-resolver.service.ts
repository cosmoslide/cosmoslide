import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  lookupObject,
  isActor,
  Person,
  Application,
  Service,
} from '@fedify/fedify';
import { Actor } from 'src/entities';
import { ActorService } from 'src/modules/microblogging/services/actor.service';

@Injectable()
export class RemoteActorResolverService {
  constructor(
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    private actorService: ActorService,
  ) {}

  /**
   * Resolve an actor by handle, URL, or IRI.
   * Checks local DB first, then falls back to remote lookup via ActivityPub.
   * Returns a persisted Actor entity or null if not found.
   */
  async resolveActor(handle: string): Promise<Actor | null> {
    // Try local lookup first
    const local = await this.actorRepository.findOne({
      where: [
        { acct: handle },
        { preferredUsername: handle },
        { url: handle },
        { iri: handle },
        { actorId: handle },
      ],
      relations: ['user'],
    });
    if (local) return local;

    // Remote lookup via ActivityPub
    const lookupInput = handle.startsWith('http') ? new URL(handle) : handle;
    const result = await lookupObject(lookupInput);

    if (!result || !isActor(result)) return null;

    if (
      result instanceof Person ||
      result instanceof Application ||
      result instanceof Service
    ) {
      return this.actorService.persistActor(result);
    }

    return null;
  }
}
