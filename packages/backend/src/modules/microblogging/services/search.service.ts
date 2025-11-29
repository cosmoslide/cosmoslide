import {
  lookupObject,
  Actor as APActor,
  Note as APNote,
  Person,
  Federation,
  Application,
  Service,
} from '@fedify/fedify';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Note, User, Tag } from 'src/entities';
import { Repository, Like } from 'typeorm';
import { ActorService } from './actor.service';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { NoteService } from './note.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Note)
    private noteRepository: Repository<Note>,

    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,

    private actorService: ActorService,

    private noteService: NoteService,
  ) {}

  async searchNote(q: string): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: [{ iri: q }, { url: q }],
    });

    if (note) return note;

    if (q.includes('http')) {
      const apNote = await lookupObject(new URL(q));
      if (apNote instanceof APNote) {
        const result = await this.noteService.persistNote(apNote);
        if (result) return result;
      }
    }

    return null;
  }

  async searchActor(q: string): Promise<Actor | null> {
    // If it's @username format (local), search for local actors only
    if (q.startsWith('@') && !q.includes('@', 1)) {
      const username = q.substring(1); // Remove the @ prefix
      const actor = await this.actorRepository.findOne({
        where: {
          preferredUsername: username,
          isLocal: true,
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
      if (
        actorObject instanceof Person ||
        actorObject instanceof Service ||
        actorObject instanceof Application
      ) {
        const actor = await this.actorService.persistActor(actorObject);

        return actor;
      }
    }

    return null;
  }

  async searchTags(tagName: string, limit = 20, offset = 0): Promise<Note[]> {
    // 1) Normalize and find matching tags
    const normalized = tagName.startsWith('#') ? tagName.slice(1) : tagName;
    const matchedTag = await this.tagRepository
      .createQueryBuilder('tag')
      .where('LOWER(tag.name) = LOWER(:name)', { name: normalized })
      .getOne();

    if (!matchedTag) return [];

    // 2) Use tag id to collect notes via relation (정확 일치)
    const notes = await this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.author', 'author')
      .innerJoin('note.tagEntities', 'tag', 'tag.id = :tagId', { tagId: matchedTag.id })
      .orderBy('note.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    // 3) Return the notes
    return notes;
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
  ): Promise<Actor | Note | Note[] | User[] | null> {
    console.log('Search query:', q);

    const isTagSearch = q.startsWith('#');
    if (isTagSearch) {
      const notes = await this.searchTags(q);
      return notes;
    }

    const isUrl = q.startsWith('http');
    if (isUrl) {
      const actor = await this.searchActor(q);
      if (actor) return actor;
    }

    if (q.includes('@')) {
      const actor = await this.searchActor(q);
      if (actor) return actor;
    }

    const note = await this.searchNote(q);
    if (note) return note;

    return null;
  }
}
