import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, User } from '../../../entities';

@Injectable()
export class ActivityHandler {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  getInboxListeners() {
    return {
      Follow: this.handleFollow.bind(this),
      Undo: this.handleUndo.bind(this),
      Create: this.handleCreate.bind(this),
      Update: this.handleUpdate.bind(this),
      Delete: this.handleDelete.bind(this),
      Like: this.handleLike.bind(this),
      Announce: this.handleAnnounce.bind(this),
    };
  }

  async handleOutbox(ctx: any, actorId: string) {
    // Extract username from actorId
    const username = actorId.split('/').pop();
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) return null;

    const posts = await this.postRepository.find({
      where: { authorId: user.id },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['author'],
    });

    const activities = await Promise.all(
      posts.map((post) => this.createActivity(post)),
    );

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actorId}/outbox`,
      totalItems: activities.length,
      orderedItems: activities,
    };
  }

  private async createActivity(post: Post) {
    const note = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: post.postUrl,
      type: 'Note',
      attributedTo: post.author.actorId,
      content: post.content,
      published: post.publishedAt || post.createdAt,
      to: this.getAddressing(post.visibility),
      cc:
        post.visibility === 'public'
          ? [`${post.author.actorId}/followers`]
          : [],
      sensitive: post.sensitive,
      summary: post.contentWarning,
      inReplyTo: post.inReplyToId,
      attachment: post.attachments,
      tag: [...post.tags, ...post.mentions],
      url: post.postUrl,
    };

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: post.activityUrl,
      type: 'Create',
      actor: post.author.actorId,
      published: post.publishedAt || post.createdAt,
      to: note.to,
      cc: note.cc,
      object: note,
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
