import {
  lookupObject,
  Actor as APActor,
  Person,
  Federation,
} from '@fedify/fedify';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Note, User } from 'src/entities';
import { Repository, Like } from 'typeorm';
import { ActorService } from './actor.service';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';

@Injectable()
export class SearchService {
  constructor(
    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private actorService: ActorService,
  ) {}

  async searchActor(q: string): Promise<Actor | null> {
    // If it's @username format (local), search for local actors only
    if (q.startsWith('@') && !q.includes('@', 1)) {
      const username = q.substring(1); // Remove the @ prefix
      const actor = await this.actorRepository.findOne({
        where: { 
          preferredUsername: username,
          isLocal: true 
        },
      });
      if (actor) return actor;
      return null; // Don't try to lookup local actors remotely
    }
    
    // For other formats (URLs or @user@domain), search normally
    const actor = await this.actorRepository.findOne({
      where: [{ acct: q }, { preferredUsername: q }, { url: q }, { iri: q }],
    });
    if (actor) return actor;

    const lookupResult = await lookupObject(
      q.includes('http') ? new URL(q) : q,
    );
    const actorObject = lookupResult;
    if (actorObject) {
      if (actorObject instanceof Person) {
        const actor = await this.actorService.persistActor(actorObject);

        return actor;
      }
    }

    return null;
  }

  async searchUsers(query: string, limit = 20, offset = 0): Promise<User[]> {
    // Search users by username or display name
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.displayName ILIKE :query', { query: `%${query}%` })
      .take(limit)
      .skip(offset)
      .getMany();

    return users;
  }

  async search(
    q: string,
    limit = 20,
    offset = 0,
  ): Promise<Actor | Note | User[] | null> {
    const isUrl = q.startsWith('http');
    if (isUrl) {
      const actor = await this.searchActor(q);
      if (actor) return actor;
    }

    if (q.includes('@')) {
      const actor = await this.searchActor(q);
      if (actor) return actor;
    }
    return null;
  }
}
