import { Injectable } from '@nestjs/common';
import {
  Create,
  Undo,
  Follow as APFollow,
  Accept,
  Reject,
  Person,
  isActor,
  lookupObject,
} from '@fedify/fedify';
import { ContextService } from './context.service';
import {
  toAPNote,
  toAPAnnounce,
  toUpdatePersonActivity,
} from 'src/lib/activitypub';
import { Actor, Follow, Note } from 'src/entities';

@Injectable()
export class ActivityPublisherService {
  constructor(private contextService: ContextService) {}

  async publishNoteCreated(actor: Actor, note: Note): Promise<void> {
    const ctx = this.contextService.createContext();
    const apNote = toAPNote(ctx, note);

    await ctx.sendActivity(
      { identifier: actor.id },
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
  }

  async publishAnnounce(actor: Actor, share: Note): Promise<void> {
    const ctx = this.contextService.createContext();
    const announce = toAPAnnounce(ctx, share);

    await ctx.sendActivity({ identifier: actor.id }, 'followers', announce, {
      immediate: true,
    });
  }

  async publishUndoAnnounce(actor: Actor, share: Note): Promise<void> {
    const ctx = this.contextService.createContext();
    const announce = toAPAnnounce(ctx, share);
    const undo = new Undo({
      id: new URL(`#undo-announce-${share.id}`, ctx.origin),
      actor: ctx.getActorUri(actor.id),
      object: announce,
    });

    await ctx.sendActivity({ identifier: actor.id }, 'followers', undo, {
      immediate: true,
    });
  }

  async publishFollow(
    followerActor: Actor,
    targetActorIri: string,
    targetInboxUrl?: string,
  ): Promise<void> {
    const ctx = this.contextService.createContext();
    const targetId = new URL(targetActorIri);

    const followActivity = new APFollow({
      actor: ctx.getActorUri(followerActor.id),
      object: targetId,
      to: targetId,
    });

    if (targetInboxUrl) {
      await ctx.sendActivity(
        { username: followerActor.preferredUsername },
        { id: targetId, inboxId: new URL(targetInboxUrl) },
        followActivity,
        { immediate: true },
      );
    } else {
      const target = await lookupObject(targetId);
      if (!target || !isActor(target)) return;
      const inboxId = target.inboxId;
      if (!target.id || !inboxId) return;
      await ctx.sendActivity(
        { username: followerActor.preferredUsername },
        { id: target.id, inboxId },
        followActivity,
        { immediate: true },
      );
    }
  }

  async publishUndoFollow(
    followerActor: Actor,
    targetActorIri: string,
    targetInboxUrl?: string,
  ): Promise<void> {
    const ctx = this.contextService.createContext();
    const targetId = new URL(targetActorIri);

    const followActivity = new APFollow({
      actor: ctx.getActorUri(followerActor.id),
      object: targetId,
      to: targetId,
    });

    const undo = new Undo({
      actor: ctx.getActorUri(followerActor.id),
      object: followActivity,
      to: targetId,
    });

    if (targetInboxUrl) {
      await ctx.sendActivity(
        { username: followerActor.preferredUsername },
        { id: targetId, inboxId: new URL(targetInboxUrl) },
        undo,
        { immediate: true },
      );
    } else {
      const target = await lookupObject(targetId);
      if (!target || !isActor(target)) return;
      const inboxId = target.inboxId;
      if (!target.id || !inboxId) return;
      await ctx.sendActivity(
        { username: followerActor.preferredUsername },
        { id: target.id, inboxId },
        undo,
        { immediate: true },
      );
    }
  }

  async publishAcceptFollow(targetActor: Actor, follow: Follow): Promise<void> {
    const ctx = this.contextService.createContext();
    const followedActorUrl = new URL(follow.following.url);
    const actor = await lookupObject(followedActorUrl);

    const followActivity = new APFollow({
      actor: ctx.getActorUri(follow.follower.id),
      object: actor?.id,
    });

    const accept = new Accept({
      actor: followActivity.objectId,
      to: followActivity.actorId,
      object: followActivity,
    });

    const follower = (await followActivity.getActor()) as Person;
    await ctx.sendActivity({ identifier: targetActor.id }, follower, accept, {
      immediate: true,
    });
  }

  async publishRejectFollow(targetActor: Actor, follow: Follow): Promise<void> {
    const ctx = this.contextService.createContext();
    const followedActorUrl = new URL(follow.following.url);
    const actor = await lookupObject(followedActorUrl);

    const followActivity = new APFollow({
      actor: ctx.getActorUri(follow.follower.id),
      object: actor?.id,
    });

    const reject = new Reject({
      actor: followActivity.objectId,
      to: followActivity.actorId,
      object: followActivity,
    });

    const follower = (await followActivity.getActor()) as Person;
    await ctx.sendActivity({ identifier: targetActor.id }, follower, reject, {
      immediate: true,
    });
  }

  async publishProfileUpdate(actor: Actor): Promise<void> {
    try {
      const ctx = this.contextService.createContext();
      const updateActivity = await toUpdatePersonActivity(ctx, actor);

      await ctx.sendActivity(
        { identifier: actor.id },
        'followers',
        updateActivity,
        {
          preferSharedInbox: true,
          excludeBaseUris: [new URL(ctx.canonicalOrigin)],
        },
      );
    } catch (error: unknown) {
      console.error('Failed to send profile update activity:', error);
    }
  }
}
