import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Note, User, Actor, Follow } from '../../entities';
import { FederationService } from '../federation/federation.service';
import { ActivityDeliveryService } from '../federation/services/activity-delivery.service';
import { ContextService } from '../federation/services/context.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class MicrobloggingService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    private federationService: FederationService,
    private activityDeliveryService: ActivityDeliveryService,
    private contextService: ContextService,
  ) {}

  async createNote(userId: string, createNoteDto: CreateNoteDto): Promise<Note> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const note = this.noteRepository.create({
      ...createNoteDto,
      authorId: userId,
      publishedAt: new Date(),
    });

    const savedNote = await this.noteRepository.save(note);
    
    // Update user's note count
    await this.userRepository.increment({ id: userId }, 'notesCount', 1);

    // Reload the note with relations
    const noteWithRelations = await this.noteRepository.findOne({
      where: { id: savedNote.id },
      relations: ['author', 'author.actor'],
    });

    if (!noteWithRelations) {
      throw new Error('Failed to reload note with relations');
    }

    // Send Create activity to followers
    const ctx = await this.contextService.createContext();
    await this.activityDeliveryService.deliverNoteCreate(noteWithRelations, user, ctx);
    
    return noteWithRelations;
  }

  async getNoteById(noteId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['author', 'author.actor'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async updateNote(userId: string, noteId: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const note = await this.getNoteById(noteId);

    if (note.authorId !== userId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(note, updateNoteDto);
    const updatedNote = await this.noteRepository.save(note);

    // Send Update activity to followers
    const ctx = await this.contextService.createContext();
    await this.activityDeliveryService.deliverNoteUpdate(updatedNote, user, ctx);

    return updatedNote;
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const note = await this.getNoteById(noteId);

    if (note.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const noteUrl = note.noteUrl;
    await this.noteRepository.remove(note);
    
    // Update user's note count
    await this.userRepository.decrement({ id: userId }, 'notesCount', 1);

    // Send Delete activity to followers
    const ctx = await this.contextService.createContext();
    await this.activityDeliveryService.deliverNoteDelete(noteId, noteUrl, user, ctx);
  }

  async getUserNotes(username: string, limit = 20, offset = 0): Promise<{ notes: Note[], total: number }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [notes, total] = await this.noteRepository.findAndCount({
      where: { authorId: user.id },
      relations: ['author', 'author.actor'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { notes, total };
  }

  async getHomeTimeline(userId: string, limit = 20, offset = 0): Promise<{ notes: Note[], total: number }> {
    // Get users that the current user follows
    const following = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'],
    });

    const followingUserIds = following.map(f => f.following.id);
    followingUserIds.push(userId); // Include own notes

    // If no one to follow (including self), return empty
    if (followingUserIds.length === 0) {
      return { notes: [], total: 0 };
    }

    const [notes, total] = await this.noteRepository.findAndCount({
      where: { authorId: In(followingUserIds) },
      relations: ['author', 'author.actor'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { notes, total };
  }

  async getPublicTimeline(limit = 20, offset = 0): Promise<{ notes: Note[], total: number }> {
    const [notes, total] = await this.noteRepository.findAndCount({
      where: [
        { visibility: 'public' },
        { visibility: 'unlisted' }
      ],
      relations: ['author', 'author.actor'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { notes, total };
  }
}