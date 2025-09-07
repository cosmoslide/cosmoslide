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

  async addToTimeline(apNote: APNote) {
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
