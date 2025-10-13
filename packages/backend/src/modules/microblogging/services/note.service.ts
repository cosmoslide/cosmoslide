import {
  Federation,
  Note as APNote,
  Person,
  PUBLIC_COLLECTION,
  Create,
  Context,
  Recipient,
  Announce as APAnnounce,
  Application,
  Service,
} from '@fedify/fedify';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Follow, Note } from 'src/entities';
import {
  convertTemporalToDate,
  toAPNote,
  toTemporalInstance,
} from 'src/lib/activitypub';
import { DeepPartial, In, IsNull, Not, Repository } from 'typeorm';
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
    if (
      attribution instanceof Person ||
      attribution instanceof Service ||
      attribution instanceof Application
    ) {
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

  async persistSharedNote(announce: APAnnounce) {
    if (announce.id == null || announce.actorId == null) {
      console.debug('Missing required fields (id, actor): {announce}', {
        announce,
      });
      return;
    }

    let actor: Actor | null = null;
    if (actor == null) {
      const apActor = await announce.getActor();
      if (apActor == null) return;

      actor = await this.actorService.persistActor(apActor as Person);
      if (actor == null) return;
    }

    const object = await announce.getObject();
    if (!(object instanceof APNote)) return;

    const apNote = object as APNote;
    const note = await this.persistNote(apNote);
    if (note == null) return;

    const to = new Set(announce.toIds.map((u) => u.href));
    const cc = new Set(announce.ccIds.map((u) => u.href));

    const iri = new URL(announce.id.href);
    let share = await this.noteRepository.findOne({
      where: {
        iri: iri.href,
      },
    });
    if (share) {
      return share;
    }

    const values: Partial<Note> = {
      iri: announce.id.href,
      visibility: to.has(PUBLIC_COLLECTION.href)
        ? 'public'
        : cc.has(PUBLIC_COLLECTION.href)
          ? 'unlisted'
          : actor.followersUrl != null &&
              (to.has(actor.followersUrl) || cc.has(actor.followersUrl))
            ? 'followers'
            : 'none',
      authorId: actor.id,
      sharedNoteId: note.id,
      content: note.content,
      sensitive: note.sensitive,
      updatedAt:
        convertTemporalToDate(
          toTemporalInstance(announce.updated ?? announce.published),
        ) ?? undefined,
      publishedAt: note.publishedAt
        ? note.publishedAt instanceof Date
          ? note.publishedAt
          : convertTemporalToDate(toTemporalInstance(note.publishedAt))
        : new Date(),
    };

    const sharedNote = this.noteRepository.create({
      ...values,
    } as DeepPartial<Note>);
    await this.noteRepository.save(sharedNote);

    share = await this.noteRepository.findOne({
      where: {
        iri: announce.id.href,
      },
      relations: ['author', 'sharedNote', 'author.user'],
    });

    return share;
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

  classifyVisibility(apNote: APNote): string {
    return 'public';
  }

  async deleteNote(actor: Actor, noteAttributes: Partial<Note>) {}

  async updateNote(actor: Actor, noteAttributes: Partial<Note>) {}
}
