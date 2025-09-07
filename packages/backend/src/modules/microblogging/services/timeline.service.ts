import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { Federation, Note as APNote } from '@fedify/fedify';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Follow, Note } from 'src/entities';
import { In, Repository } from 'typeorm';
import { NoteService } from './note.service';
import { ActorService } from './actor.service';
import { TimelinePost } from 'src/entities/timeline-post.entity';
import { FollowService } from './follow.service';

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
        authorId: In(follows.map((follow) => follow.followingId)),
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

  async addSharedItemToTimeline(actor: Actor, apNote: APNote) {
    const note = await this.noteService.persistNote(apNote);
    const sharedNote = await this.noteService.shareNote(actor, note!);
    const timelinePost = this.timelinePostRepository.create({
      noteId: sharedNote!.id,
      authorId: actor!.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<TimelinePost>);

    await this.timelinePostRepository.save(timelinePost);
  }

  async addItemToTimeline(apNote: APNote) {
    const note = await this.noteService.persistNote(apNote);

    const timelinePost = this.timelinePostRepository.create({
      noteId: note!.id,
      authorId: note!.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<TimelinePost>);

    await this.timelinePostRepository.save(timelinePost);
  }
}
