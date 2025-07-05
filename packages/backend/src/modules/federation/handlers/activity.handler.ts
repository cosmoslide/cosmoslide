import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note, User, Actor, Follow } from '../../../entities';

@Injectable()
export class ActivityHandler {
  private Follow: any;
  private Undo: any;
  private Create: any;
  private Update: any;
  private Delete: any;
  private Like: any;
  private Announce: any;

  private fedifyInitiaized = false;

  constructor(
    @InjectRepository(Note) private noteRepository: Repository<Note>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Actor) private actorRepository: Repository<Actor>,
    @InjectRepository(Follow) private followRepository: Repository<Follow>,
  ) {
  }

  private initializeFedifyClasses() {
    if (this.fedifyInitiaized) return;
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const fedifyModule = importDynamic('@fedify/fedify');
    this.Follow = fedifyModule.Follow;
    this.Undo = fedifyModule.Undo;
    this.Create = fedifyModule.Create;
    this.Update = fedifyModule.Update;
    this.Delete = fedifyModule.Delete;
    this.Like = fedifyModule.Like;
    this.Announce = fedifyModule.Announce;


    this.fedifyInitiaized = true;
  }

  getInboxListeners() {
    return {
      [this.Follow]: this.handleFollow.bind(this),
      [this.Undo]: this.handleUndo.bind(this),
      [this.Create]: this.handleCreate.bind(this),
      [this.Update]: this.handleUpdate.bind(this),
      [this.Delete]: this.handleDelete.bind(this),
      [this.Like]: this.handleLike.bind(this),
      [this.Announce]: this.handleAnnounce.bind(this),
    };
  }

  async handleOutbox(ctx: any, actorId: string) {
    // Extract username from actorId
    const username = actorId.split('/').pop();
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) return null;

    const notes = await this.noteRepository.find({
      where: { authorId: user.id },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['author'],
    });

    const activities = await Promise.all(
      notes.map((note) => this.createActivity(note)),
    );

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actorId}/outbox`,
      totalItems: activities.length,
      orderedItems: activities,
    };
  }

  private async createActivity(note: Note) {
    const noteObject = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: note.noteUrl,
      type: 'Note',
      attributedTo: note.author.actorId,
      content: note.content,
      published: note.publishedAt || note.createdAt,
      to: this.getAddressing(note.visibility),
      cc:
        note.visibility === 'public'
          ? [`${note.author.actorId}/followers`]
          : [],
      sensitive: note.sensitive,
      summary: note.contentWarning,
      inReplyTo: note.inReplyToId,
      attachment: note.attachments,
      tag: [...(note.tags || []), ...(note.mentions || [])],
      url: note.noteUrl,
    };

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: note.activityUrl,
      type: 'Create',
      actor: note.author.actorId,
      published: note.publishedAt || note.createdAt,
      to: noteObject.to,
      cc: noteObject.cc,
      object: noteObject,
    };
  }

  private getAddressing(visibility: string): string[] {
    switch (visibility) {
      case 'public':
        return ['https://www.w3.org/ns/activitystreams#Public'];
      case 'unlisted':
        return [];
      case 'followers':
        return [];
      case 'direct':
        return [];
      default:
        return ['https://www.w3.org/ns/activitystreams#Public'];
    }
  }

  private async handleFollow(ctx: any, activity: any) {
    console.log('Handle follow:', activity);
    // TODO: Implement follow handling
  }

  private async handleUndo(ctx: any, activity: any) {
    console.log('Handle undo:', activity);
    // TODO: Implement undo handling
  }

  private async handleCreate(ctx: any, activity: any) {
    console.log('Handle create:', activity);
    // TODO: Implement create handling
  }

  private async handleUpdate(ctx: any, activity: any) {
    console.log('Handle update:', activity);
    // TODO: Implement update handling
  }

  private async handleDelete(ctx: any, activity: any) {
    console.log('Handle delete:', activity);
    // TODO: Implement delete handling
  }

  private async handleLike(ctx: any, activity: any) {
    console.log('Handle like:', activity);
    // TODO: Implement like handling
  }

  private async handleAnnounce(ctx: any, activity: any) {
    console.log('Handle announce:', activity);
    // TODO: Implement announce handling
  }
}
