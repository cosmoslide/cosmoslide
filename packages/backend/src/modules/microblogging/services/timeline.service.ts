import { Note as APNote, Announce as APAnnounce } from '@fedify/fedify';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Actor, Follow, Note } from 'src/entities';
import { In, Repository } from 'typeorm';
import { NoteService } from './note.service';
import { ActorService } from './actor.service';
import { MarkdownService } from './markdown.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';
import { FollowService } from './follow.service';
import { ContextService } from 'src/modules/federation/services/context.service';
import {
  NoteCreatedEvent,
  NoteRepostedEvent,
  RepostUndoneEvent,
} from '../events/domain-events';

@Injectable()
export class TimelineService {
  constructor(
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
    private markdownService: MarkdownService,
    private contextService: ContextService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createNote(
    actor: Actor,
    noteAttributes: Partial<Note> & {
      contentType?: 'text/plain' | 'text/markdown';
    },
  ): Promise<Note | null> {
    const { contentType = 'text/plain', ...restAttributes } = noteAttributes;
    const rawContent = restAttributes.content || '';

    // Process content based on contentType
    let renderedContent: string;
    let source: string | undefined = undefined;
    let mediaType: string = contentType;

    if (contentType === 'text/markdown') {
      source = rawContent;
      renderedContent = this.markdownService.render(rawContent);
    } else {
      // Plain text - escape HTML for safety
      renderedContent = this.markdownService.escapeHtml(rawContent);
    }

    // 1. Extract hashtags from raw content (not rendered HTML)
    const hashtagMatches = Array.from(
      rawContent.matchAll(/#([\p{L}\d_]{1,50})/gu),
    );
    const hashtags = hashtagMatches
      .map((match) => match[1])
      .filter((val) => Boolean(val));

    // 2. Build tags array (merge with any provided tags, dedupe by name)
    const existingTags = (restAttributes.tags || []).map((tag) => tag.name);
    const allTagNames = Array.from(
      new Set([...existingTags, ...hashtags.map((hashtag) => `#${hashtag}`)]),
    );

    const tags =
      allTagNames.length > 0
        ? allTagNames.map((tagName) => ({
            type: 'Hashtag',
            href: `${process.env.FEDERATION_ORIGIN}/tags/${tagName}`,
            name: tagName,
          }))
        : [];

    const note = this.noteRepository.create({
      author: actor,
      publishedAt: new Date(),
      ...restAttributes,
      content: renderedContent,
      source,
      mediaType,
      tags,
    });

    // Save note first
    await this.noteRepository.save(note);

    // Attach Tag relations via Tag entity
    const tagNames = (note.tags || [])
      .map((tag) => tag.name)
      .filter((name) => Boolean(name))
      .map((name) => (name.startsWith('#') ? name.slice(1) : name));

    if (tagNames.length > 0) {
      await this.noteService.upsertAndAttachTags(note, tagNames);
    }

    // Generate IRI using federation context
    const ctx = this.contextService.createContext();
    const iri = ctx.getObjectUri(APNote, { noteId: note.id });

    await this.noteRepository.update(note.id, {
      iri: iri.href,
      url: iri.href,
    });

    // Add to local timeline
    const timelinePost = this.timelinePostRepository.create({
      noteId: note.id,
      authorId: actor.id,
    });
    await this.timelinePostRepository.save(timelinePost);

    // Emit event for federation layer to distribute Create activity
    this.eventEmitter.emit('note.created', new NoteCreatedEvent(actor, note));

    return note;
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

  async repostNote(actor: Actor, noteId: string): Promise<Note> {
    // 1. Fetch target note with needed relations
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['author', 'author.user'],
    });
    if (!note) throw new NotFoundException('Note not found');

    // 2. Check not already reposted
    const alreadyReposted = await this.noteService.hasReposted(
      actor.id,
      noteId,
    );
    if (alreadyReposted) throw new ConflictException('Already reposted');

    // 3. Create share record
    const share = await this.noteService.shareNote(actor, note);

    // 4. Generate IRI using federation context
    const ctx = this.contextService.createContext();
    const iri = ctx.getObjectUri(APAnnounce, { announceId: share.id });
    await this.noteRepository.update(share.id, { iri: iri.href });

    // 5. Increment sharesCount
    await this.noteRepository.increment({ id: noteId }, 'sharesCount', 1);

    // 6. Add to timeline
    await this.addSharedItemToTimeline(actor, share);

    // 7. Reload share with all needed relations
    const reloadedShare = await this.noteRepository.findOne({
      where: { id: share.id },
      relations: ['author', 'author.user', 'sharedNote'],
    });

    // 8. Emit event for federation layer to send Announce activity
    this.eventEmitter.emit(
      'note.reposted',
      new NoteRepostedEvent(actor, reloadedShare!),
    );

    return reloadedShare!;
  }

  async undoRepost(actor: Actor, noteId: string): Promise<void> {
    // 1. Find existing share
    const share = await this.noteService.getRepostByActor(actor.id, noteId);
    if (!share) throw new NotFoundException('Repost not found');

    // 2. Emit event BEFORE deletion so federation listener has share data
    this.eventEmitter.emit(
      'repost.undone',
      new RepostUndoneEvent(actor, share),
    );

    // 3. Remove timeline post
    await this.timelinePostRepository.delete({ noteId: share.id });

    // 4. Decrement sharesCount (min 0)
    await this.noteRepository.decrement({ id: noteId }, 'sharesCount', 1);
    await this.noteRepository
      .createQueryBuilder()
      .update(Note)
      .set({ sharesCount: () => 'GREATEST("sharesCount", 0)' })
      .where('id = :id', { id: noteId })
      .execute();

    // 5. Delete share note
    await this.noteRepository.delete(share.id);
  }

  async removeSharedItemByIri(announceIri: string): Promise<void> {
    const share = await this.noteRepository.findOne({
      where: { iri: announceIri },
    });
    if (!share) return;

    // Remove timeline post
    await this.timelinePostRepository.delete({ noteId: share.id });

    // Decrement sharesCount on original note
    if (share.sharedNoteId) {
      await this.noteRepository.decrement(
        { id: share.sharedNoteId },
        'sharesCount',
        1,
      );
      await this.noteRepository
        .createQueryBuilder()
        .update(Note)
        .set({ sharesCount: () => 'GREATEST("sharesCount", 0)' })
        .where('id = :id', { id: share.sharedNoteId })
        .execute();
    }

    // Delete the share note
    await this.noteRepository.delete(share.id);
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
    if (!note) return null;

    const existing = await this.timelinePostRepository.findOne({
      where: { noteId: note.id },
    });
    if (existing) return note;

    const timelinePost = this.timelinePostRepository.create({
      noteId: note.id,
      authorId: note.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<TimelinePost>);

    await this.timelinePostRepository.save(timelinePost);

    return note;
  }
}
