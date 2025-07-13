import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FEDIFY_FEDERATION } from '../../../libs/fedify-nestjs';
import { Note, User, Actor, Follow } from '../../../entities';
import { Create, Delete, Federation, PUBLIC_COLLECTION, RequestContext, Update, Note as APNote } from '@fedify/fedify';
import { Temporal } from '@js-temporal/polyfill';

@Injectable()
export class ActivityDeliveryService {
  private readonly logger = new Logger(ActivityDeliveryService.name);

  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
    @InjectRepository(Follow) private followRepository: Repository<Follow>,
    @InjectRepository(Actor) private actorRepository: Repository<Actor>,
  ) { }

  async deliverNoteCreate(note: Note, author: User, ctx: RequestContext<unknown>): Promise<void> {
    this.logger.log(`Delivering Create activity for note ${note.id}`);

    try {
      const publishedDate = note.publishedAt || note.createdAt;
      const publishedInstant = Temporal.Instant.from(publishedDate.toISOString());

      const toRecipients = this.getToRecipients(note, author);
      const ccRecipients = this.getCcRecipients(note, author);

      const noteObject = new APNote({
        id: new URL(note.noteUrl),
        attribution: new URL(author.actorId),
        content: note.content,
        published: publishedInstant,
        tos: toRecipients, // Note: Fedify uses 'tos' for multiple recipients
        ccs: ccRecipients, // Note: Fedify uses 'ccs' for multiple recipients
        sensitive: note.sensitive,
        summary: note.contentWarning || undefined,

        //inReplyTo: note.inReplyToId ? new URL(
        //
        //) : undefined,
        url: new URL(note.noteUrl),
      });

      const activity = new Create({
        object: noteObject,
        id: new URL(note.activityUrl),
        actor: new URL(author.actorId),
        published: publishedInstant,
        tos: toRecipients,
        ccs: ccRecipients,
      });

      // Send to followers based on visibility
      if (note.visibility !== 'direct') {
        // Get the actual followers from the database
        const followers = await this.followRepository.find({
          where: { followingId: author.id },
          relations: ['follower', 'follower.actor'],
        });

        // Create recipient objects for each follower
        const recipients = followers
          .filter(f => f.follower?.actor?.actorId)
          .map(f => ({
            id: new URL(f.follower.actor.actorId),
            inboxId: new URL(`${f.follower.actor.actorId}/inbox`),
          }));

        if (recipients.length > 0) {
          await ctx.sendActivity(
            {
              username: author.username,
            },
            recipients,
            activity,
            { immediate: true } // Add options parameter
          );
          this.logger.log(`Successfully delivered Create activity for note ${note.id} to ${recipients.length} followers`);
        }
      }

      // For direct messages, send to mentioned users
      if (note.visibility === 'direct' && note.mentions && note.mentions.length > 0) {
        for (const mention of note.mentions) {
          if (mention.href) {
            try {
              // Create a recipient object for the mentioned user
              const recipient = {
                id: new URL(mention.href),
                inboxId: new URL(`${mention.href}/inbox`), // Assume standard inbox URL
              };

              await ctx.sendActivity(
                {
                  username: author.username,
                },
                recipient,
                activity,
                { immediate: true }
              );
              this.logger.log(`Delivered Create activity to mentioned user: ${mention.href}`);
            } catch (error) {
              this.logger.error(`Failed to deliver to mentioned user ${mention.href}:`, error);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to deliver Create activity for note ${note.id}:`, error);
    }
  }

  async deliverNoteUpdate(note: Note, author: User, ctx: RequestContext<unknown>): Promise<void> {
    this.logger.log(`Delivering Update activity for note ${note.id}`);

    try {
      const publishedDate = note.publishedAt || note.createdAt;
      const publishedInstant = Temporal.Instant.from(publishedDate.toISOString());

      const toRecipients = this.getToRecipients(note, author);
      const ccRecipients = this.getCcRecipients(note, author);

      const noteObject = new APNote({
        id: new URL(note.noteUrl),
        attribution: new URL(author.actorId),
        content: note.content,
        published: publishedInstant,
        tos: toRecipients,
        ccs: ccRecipients,
        sensitive: note.sensitive,
        summary: note.contentWarning || undefined,
        //inReplyTo: note.inReplyToId ? new URL(note.inReplyToId) : undefined,

        url: new URL(note.noteUrl),
      });

      const updateInstant = Temporal.Instant.from(new Date().toISOString());

      const activity = new Update({
        id: new URL(`${note.activityUrl}#update-${Date.now()}`),
        actor: new URL(author.actorId),
        object: noteObject,
        published: updateInstant,
        tos: toRecipients,
        ccs: ccRecipients,
      });

      // Send update to followers
      if (note.visibility !== 'direct') {
        // Get the actual followers from the database
        const followers = await this.followRepository.find({
          where: { followingId: author.id },
          relations: ['follower', 'follower.actor'],
        });

        // Create recipient objects for each follower
        const recipients = followers
          .filter(f => f.follower?.actor?.actorId)
          .map(f => ({
            id: new URL(f.follower.actor.actorId),
            inboxId: new URL(`${f.follower.actor.actorId}/inbox`),
          }));

        if (recipients.length > 0) {
          await ctx.sendActivity(
            {
              username: author.username,
            },
            recipients,
            activity,
            { immediate: true }
          );
          this.logger.log(`Successfully delivered Update activity for note ${note.id} to ${recipients.length} followers`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to deliver Update activity for note ${note.id}:`, error);
    }
  }

  async deliverNoteDelete(noteId: string, noteUrl: string, author: User, ctx: RequestContext<unknown>): Promise<void> {
    this.logger.log(`Delivering Delete activity for note ${noteId}`);

    try {

      const deleteInstant = Temporal.Instant.from(new Date().toISOString());

      const activity = new Delete({
        id: new URL(`${noteUrl}#delete-${Date.now()}`),
        actor: new URL(author.actorId),
        object: new URL(noteUrl),
        published: deleteInstant,
        tos: [PUBLIC_COLLECTION || 'https://www.w3.org/ns/activitystreams#Public'],
        ccs: [new URL(`${author.actorId}/followers`)],
      });

      // Send delete to followers
      // Get the actual followers from the database
      const followers = await this.followRepository.find({
        where: { followingId: author.id },
        relations: ['follower', 'follower.actor'],
      });

      // Create recipient objects for each follower
      const recipients = followers
        .filter(f => f.follower?.actor?.actorId)
        .map(f => ({
          id: new URL(f.follower.actor.actorId),
          inboxId: new URL(`${f.follower.actor.actorId}/inbox`),
        }));

      if (recipients.length > 0) {
        await ctx.sendActivity(
          {
            username: author.username,
          },
          recipients,
          activity,
          { immediate: true }
        );
        this.logger.log(`Successfully delivered Delete activity for note ${noteId} to ${recipients.length} followers`);
      }
    } catch (error) {
      this.logger.error(`Failed to deliver Delete activity for note ${noteId}:`, error);
    }
  }

  private getToRecipients(note: Note, author: User): URL[] {
    const to: URL[] = [];

    switch (note.visibility) {
      case 'public':
        to.push(PUBLIC_COLLECTION || 'https://www.w3.org/ns/activitystreams#Public');
        break;
      case 'unlisted':
        to.push(new URL(`${author.actorId}/followers`));
        break;
      case 'followers':
        to.push(new URL(`${author.actorId}/followers`));
        break;
      case 'direct':
        // For direct messages, add mentioned users
        if (note.mentions && note.mentions.length > 0) {
          note.mentions.forEach(mention => {
            if (mention.href) {
              to.push(new URL(mention.href));
            }
          });
        }
        break;
    }

    return to;
  }

  private getCcRecipients(note: Note, author: User): URL[] {
    const cc: URL[] = [];

    switch (note.visibility) {
      case 'public':
        cc.push(new URL(`${author.actorId}/followers`));
        break;
      case 'unlisted':
        cc.push(PUBLIC_COLLECTION || 'https://www.w3.org/ns/activitystreams#Public');
        break;
      // No cc for followers-only or direct messages
    }

    return cc;
  }
}
