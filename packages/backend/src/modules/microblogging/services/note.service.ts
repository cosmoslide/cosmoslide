import { Federation } from '@fedify/fedify';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor, Note } from 'src/entities';
import { Repository } from 'typeorm';

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
    actor: Actor,
    ...pagination
  }: { actor: Actor } & PaginationParameter): Promise<Note[]> {
    return [];
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
    return note;
  }

  async deleteNote(actor: Actor, noteAttributes: Partial<Note>) {}

  async updateNote(actor: Actor, noteAttributes: Partial<Note>) {}
}
