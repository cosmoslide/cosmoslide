import {
  Federation,
  Note as APNote,
  Person,
  PUBLIC_COLLECTION,
  Create,
  Context,
  Recipient,
} from '@fedify/fedify';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Follow, Note } from 'src/entities';
import { toAPNote } from 'src/lib/activitypub';
import { DeepPartial, In, Repository } from 'typeorm';
import { ActorService } from './actor.service';
import { Temporal } from '@js-temporal/polyfill';

interface PaginationParameter {
  cursor: string | null;
  limit: number;
}

interface PaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  last: boolean;
}

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @InjectRepository(Note)
    private noteRepository: Repository<Note>,

    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    private actorService: ActorService,

    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,
  ) {}

  async getPublicTimelineNotes({ ...pagination }): Promise<Note[]> {
    const { limit, cursor } = pagination;
    const offset = parseInt(cursor || '0');

    const notes = await this.noteRepository.find({
      relations: ['author'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return notes;
  }

  async getHomeTimelineNotes({
    actor,
    ...pagination
  }: { actor: Actor } & PaginationParameter): Promise<Note[]> {
    const { limit, cursor } = pagination;
    const offset = parseInt(cursor || '0');

    // Get the accounts this actor follows
    const followings = await this.followRepository.find({
      select: ['followingId'],
      where: {
        followerId: actor.id,
        status: 'accepted',
      },
    });
    const followingIds = followings.map((following) => following.followingId);

    // Include the actor's own posts and posts from accounts they follow
    const notes = await this.noteRepository.find({
      where: {
        authorId: In([actor.id, ...followingIds]),
      },
      relations: ['author'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return notes;
  }

  async persistNote(apNote: APNote): Promise<Note | null> {
    const apNoteId = apNote.id;
    if (!apNoteId) return null;

    const apNoteHref = apNoteId.href;
    if (!apNoteHref) return null;

    const iri = apNote.id.href;
    let note = await this.noteRepository.findOne({
      where: {
        iri,
      },
    });
    if (note) return note;

    let actor: Actor | null = null;
    const attribution = await apNote.getAttribution();
    if (attribution instanceof Person) {
      actor = await this.actorService.persistActor(attribution);
    }

    note = this.noteRepository.create({
      content: apNote.content?.toString(),
      sensitive: apNote.sensitive || false,
      actorId: actor?.id,
      authorId: actor?.id,
      iri,
      visibility: this.classifyVisibility(apNote),
      url: apNote?.url?.href,
      publishedAt: apNote.published,
    } as DeepPartial<Note>);

    await this.noteRepository.save(note);

    return note;
  }

  async shareNote(actor: Actor, note: Note) {
    const sharedNote = this.noteRepository.create({
      sharedNoteId: note.id,
      authorId: actor.id,
      visibility: 'unlisted',
      publishedAt: new Date(),
    } as DeepPartial<Note>);

    await this.noteRepository.save(sharedNote);

    return sharedNote;
  }

  async getNoteById(noteId: string): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['author'],
    });
    return note;
  }

  async getNotesAuthoredBy({
    actor,
    visibleTo,
  }: {
    actor: Actor;
    visibleTo?: Actor;
  }): Promise<Note[]> {
    const notes = await this.noteRepository.find({
      where: {
        authorId: actor.id,
      },
      relations: ['author'],
      order: {
        createdAt: 'DESC',
      },
    });

    return notes;
  }

  async createNote(
    actor: Actor,
    noteAttributes: Partial<Note>,
  ): Promise<Note | null> {
    const note = this.noteRepository.create({
      author: actor,
      publishedAt: new Date(),
      ...noteAttributes,
    });

    await this.noteRepository.save(note);

    const ctx = await this.#createFederationContext();
    const iri = ctx.getObjectUri(APNote, { noteId: note.id });

    await this.noteRepository.update(note.id, {
      iri: iri.href,
      url: iri.href,
    });

    ctx.sendActivity(
      {
        identifier: actor.id,
      },
      // this.#getRecipients(ctx, note),
      'followers',
      new Create({
        id: new URL('#create', note.id ?? ctx.origin),
        object: toAPNote(ctx, note),
      }),
      { immediate: true },
    );

    return note;
  }

  async #createFederationContext() {
    const federationOrigin = process.env.FEDERATION_ORIGIN;
    const ctx = this.federation.createContext(
      new URL(federationOrigin || ''),
      undefined,
    );

    return ctx;
  }

  classifyVisibility(apNote: APNote): string {
    return 'public';
  }

  #getRecipients(ctx: Context<unknown>, note: Note) {
    switch (note.visibility) {
      case 'public':
        return PUBLIC_COLLECTION;
      case 'unlisted':
        return PUBLIC_COLLECTION;
      case 'followers':
        return 'followers';
      default:
        return 'followers';
    }
  }

  async deleteNote(actor: Actor, noteAttributes: Partial<Note>) {}

  async updateNote(actor: Actor, noteAttributes: Partial<Note>) {}
}
