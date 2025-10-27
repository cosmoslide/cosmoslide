import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import {
  Federation,
  Note as APNote,
  Announce as APAnnounce,
  Create,
} from '@fedify/fedify';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Follow, Note } from 'src/entities';
import { In, Repository } from 'typeorm';
import { NoteService } from './note.service';
import { ActorService } from './actor.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';
import { FollowService } from './follow.service';
import { toAPNote } from 'src/lib/activitypub';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @InjectRepository(Note)
    private noteRepository: Repository<Note>,

    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    @InjectRepository(TimelinePost)
    private timelinePostRepository: Repository<TimelinePost>,

    private noteService: NoteService,
    private actorService: ActorService,
    private followService: FollowService,
  ) {}
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

    const apNote = toAPNote(ctx, note);

    ctx.sendActivity(
      {
        identifier: actor.id,
      },
      // this.#getRecipients(ctx, note),
      'followers',
      new Create({
        id: new URL('#create', apNote.id ?? ctx.origin),
        object: apNote,
        actors: apNote?.attributionIds,
        tos: apNote?.toIds,
        ccs: apNote?.ccIds,
      }),
      { immediate: true },
    );

    this.addItemToTimeline(apNote);

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

  async getHomeTimeline(actor: Actor, cursor: string = '0') {
    const follows = await this.followRepository.find({
      select: ['followingId'],
      where: {
        followerId: actor.id,
        status: 'accepted',
      },
    });

    const timelinePosts = await this.timelinePostRepository.find({
      relations: [
        'author',
        'note',
        'note.sharedNote',
        'note.sharedNote.author',
      ],
      where: {
        authorId: In([
          actor.id,
          ...follows.map((follow) => follow.followingId),
        ]),
      },
      order: {
        createdAt: 'DESC',
      },
      take: 20,
      skip: parseInt(cursor),
    });

    return timelinePosts.map((post) => ({
      id: post.id,
      author: post.author,
      note: post.note,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  }

  async addSharedItemToTimeline(actor: Actor, share: Note) {
    const timelinePost = this.timelinePostRepository.create({
      authorId: actor.id,
      noteId: share.id,
    });

    await this.timelinePostRepository.save(timelinePost);
  }

  async addItemToTimeline(apNote: APNote): Promise<Note | null> {
    const note = await this.noteService.persistNote(apNote);

    const timelinePost = this.timelinePostRepository.create({
      noteId: note!.id,
      authorId: note!.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<TimelinePost>);

    await this.timelinePostRepository.save(timelinePost);

    return note;
  }
}
