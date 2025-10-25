import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Follow, Actor } from '../../../entities';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { ContextService } from '../../federation/services/context.service';
import {
  Federation,
  Follow as APFollow,
  lookupObject,
  isActor,
  Undo,
  Context,
  Accept,
  Person,
  Reject,
} from '@fedify/fedify';

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
export class FollowService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    private contextService: ContextService,

    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,
  ) {}

  async followUser(
    followerId: string,
    targetUsername: string,
  ): Promise<{ success: boolean; message: string }> {
    const followerUser = await this.userRepository.findOne({
      where: { id: followerId },
      relations: ['actor'],
    });

    const followerActor = followerUser?.actor;
    if (!followerActor) {
      return {
        success: false,
        message: 'Follower Actor Not Found',
      };
    }

    const targetActor = await this.actorRepository.findOne({
      where: [{ preferredUsername: targetUsername }, { acct: targetUsername }],
    });

    const federationDomain = process.env.FEDERATION_HANDLE_DOMAIN;
    const ctx = await this.#createFederationContext();

    const targetAcct = targetUsername.slice(1).includes('@')
      ? targetUsername
      : `@${targetUsername}@${federationDomain}`;
    const actor = await lookupObject(targetAcct.trim());
    if (!isActor(actor)) {
      return {
        success: false,
        message: 'Invalid actor handle or URL',
      };
    }
    const apFollowObject = new APFollow({
      actor: ctx.getActorUri(followerActor.id),
      object: actor.id,
      to: actor.id,
    });

    if (!targetActor) {
      await ctx.sendActivity(
        {
          username: followerActor.preferredUsername,
        },
        actor,
        apFollowObject,
        {
          immediate: true,
        },
      );

      return { success: true, message: 'Request to follow!' };
    }

    const follow = await this.followActor(followerActor, targetActor);
    if (!follow) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    await ctx.sendActivity(
      {
        username: followerActor.preferredUsername,
      },
      actor,
      apFollowObject,
      { immediate: true },
    );

    return { success: true, message: 'Successfully followed user' };
  }

  async unfollowUser(
    followerId: string,
    targetUsername: string,
  ): Promise<{ success: boolean; message: string }> {
    const followerUser = await this.userRepository.findOne({
      where: { id: followerId },
      relations: ['actor', 'actor.user'],
    });

    const followerActor = followerUser?.actor;
    if (!followerActor) {
      return {
        success: false,
        message: 'Follower Actor Not Found',
      };
    }

    const targetActor = await this.actorRepository.findOne({
      where: [{ preferredUsername: targetUsername }, { acct: targetUsername }],
      relations: ['user'],
    });

    const ctx = await this.#createFederationContext();
    if (!targetActor) {
      const actor = await lookupObject(targetUsername.trim());
      if (!isActor(actor)) {
        return {
          success: false,
          message: 'Invalid actor handle or URL',
        };
      }

      // For remote actors, send an Undo Follow activity
      const followActivity = new APFollow({
        actor: ctx.getActorUri(followerActor.id),
        object: actor.id,
        to: actor.id,
      });

      await ctx.sendActivity(
        {
          username: followerActor.preferredUsername,
        },
        {
          id: actor.id,
          inboxId: actor.inboxId,
        },
        new Undo({
          actor: ctx.getActorUri(followerActor.id),
          object: followActivity,
          to: actor.id,
        }),
        {
          immediate: true,
        },
      );

      return { success: true, message: 'Request to unfollow sent!' };
    }

    const followActivity = new APFollow({
      actor: ctx.getActorUri(followerActor.id),
      object: new URL(targetActor.actorId),
      to: new URL(targetActor.actorId),
    });

    await ctx.sendActivity(
      {
        username: followerActor.preferredUsername,
      },
      {
        id: new URL(targetActor.actorId),
        inboxId: new URL(targetActor.inboxUrl),
      },
      new Undo({
        actor: ctx.getActorUri(followerActor.id),
        object: followActivity,
        to: new URL(targetActor.actorId),
      }),
      {
        immediate: true,
      },
    );

    const unfollowed = await this.unfollowActor(followerActor, targetActor);
    if (!unfollowed) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    return { success: true, message: 'Successfully unfollowed user' };
  }

  async followActor(followerActor: Actor, followingActor: Actor) {
    let follow = await this.followRepository.findOne({
      where: {
        follower: followerActor,
        following: followingActor,
      },
    });

    if (follow) return follow;

    follow = this.followRepository.create({
      follower: followerActor,
      following: followingActor,
      status: 'pending',
    });

    await this.followRepository.save(follow);

    return follow;
  }

  async unfollowActor(followerActor: Actor, followingActor: Actor) {
    const follow = await this.followRepository.find({
      where: {
        followerId: followerActor.id,
        followingId: followingActor.id,
      },
    });

    if (!follow) {
      return null;
    }

    const isAccepted = follow[0].status === 'accepted';

    await this.followRepository.remove(follow);

    if (isAccepted) {
      if (followingActor.user)
        await this.userRepository.decrement(
          { id: followingActor.user.id },
          'followersCount',
          1,
        );

      if (followerActor.user)
        await this.userRepository.decrement(
          { id: followerActor.user.id },
          'followingsCount',
          1,
        );
    }

    return true;
  }

  async sendAcceptFollowRequest(requestedActor: Actor, targetActor: Actor) {
    const follow = await this.followRepository.findOne({
      where: {
        followerId: requestedActor.id,
        followingId: targetActor.id,
        status: 'pending',
      },
      relations: ['follower', 'following'],
    });

    if (follow === null) return false;

    const ctx = await this.#createFederationContext();

    const followActivity = await this.#buildFollowActivity(ctx, follow);
    const accept = new Accept({
      actor: followActivity.objectId,
      to: followActivity.actorId,
      object: followActivity,
    });

    const follower = (await followActivity.getActor()) as Person;
    await ctx.sendActivity({ identifier: targetActor.id }, follower, accept, {
      immediate: true,
    });

    return true;
  }

  async sendRejectFollowRequest(requestedActor: Actor, targetActor: Actor) {
    const follow = await this.followRepository.findOne({
      where: {
        followerId: requestedActor.id,
        followingId: targetActor.id,
        status: 'pending',
      },
      relations: ['follower', 'following'],
    });

    if (follow === null) return false;

    const ctx = await this.#createFederationContext();

    const followActivity = await this.#buildFollowActivity(ctx, follow);
    const reject = new Reject({
      actor: followActivity.objectId,
      to: followActivity.actorId,
      object: followActivity,
    });

    const follower = (await followActivity.getActor()) as Person;
    await ctx.sendActivity({ identifier: targetActor.id }, follower, reject, {
      immediate: true,
    });

    return true;
  }

  async #buildFollowActivity(
    ctx: Context<unknown>,
    follow: Follow,
  ): Promise<APFollow> {
    const actor = await lookupObject(new URL(follow.following.url));
    return new APFollow({
      actor: ctx.getActorUri(follow.follower.id),
      object: actor?.id,
    });
  }

  async #createFederationContext() {
    const federationOrigin = process.env.FEDERATION_ORIGIN;
    const ctx = this.federation.createContext(
      new URL(federationOrigin || ''),
      undefined,
    );

    return ctx;
  }

  async acceptFollowRequest(requestedActor: Actor, targetActor: Actor) {
    let follow = await this.followRepository.findOne({
      where: {
        followerId: requestedActor.id,
        followingId: targetActor.id,
      },
    });

    if (!follow) return null;

    await this.followRepository.update(follow.id, {
      status: 'accepted',
      acceptedAt: new Date(),
    });

    if (targetActor.user)
      await this.userRepository.increment(
        { id: targetActor.user.id },
        'followersCount',
        1,
      );

    if (requestedActor.user)
      await this.userRepository.increment(
        { id: requestedActor.user.id },
        'followingsCount',
        1,
      );

    return follow;
  }

  async rejectFollowRequest(requestedActor: Actor, targetActor: Actor) {
    const follow = await this.followRepository.findOne({
      where: {
        followerId: requestedActor.id,
        followingId: targetActor.id,
      },
    });

    if (!follow) {
      return null;
    }

    await this.followRepository.remove(follow);
  }

  async getFollowStatus(
    currentUserId: string,
    targetUsername: string,
  ): Promise<{ status: 'none' | 'pending' | 'accepted' }> {
    try {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
      });

      const targetActor = await this.actorRepository.findOne({
        where: [
          { preferredUsername: targetUsername },
          { acct: targetUsername },
        ],
      });

      if (!currentUser || !targetActor) {
        return { status: 'none' };
      }

      const followerActor = await this.actorRepository.findOne({
        where: { userId: currentUser.id },
      });

      if (!followerActor || !targetActor) {
        return { status: 'none' };
      }

      const follow = await this.followRepository.findOne({
        where: {
          followerId: followerActor.id,
          followingId: targetActor.id,
        },
      });

      if (!follow) {
        return { status: 'none' };
      }

      // Return the actual status from the Follow entity
      return { status: follow.status as 'pending' | 'accepted' };
    } catch (error) {
      return { status: 'none' };
    }
  }

  async getFollowRequests(
    username: string,
    pagination: PaginationParameter,
  ): Promise<PaginationResult<Actor>> {
    const { cursor, limit } = pagination;
    const offset = parseInt(cursor || '0');

    const actor = await this.actorRepository.findOne({
      where: { preferredUsername: username },
    });

    if (!actor)
      return {
        items: [],
        nextCursor: null,
        last: false,
      };

    const [follows, total] = await this.followRepository.findAndCount({
      where: {
        followingId: actor.id,
        status: 'pending',
      },
      relations: ['following', 'follower', 'follower.user'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      items: follows
        .filter((follow) => follow.follower !== null)
        .map((follow) => follow.follower),
      nextCursor: (limit + offset).toString(),
      last: offset >= total,
    };
  }

  async getFollowings(
    identifier: string,
    pagination: PaginationParameter,
  ): Promise<PaginationResult<Actor>> {
    const { cursor, limit } = pagination;
    const offset = parseInt(cursor || '0');

    const actor = await this.actorRepository.findOne({
      where: { id: identifier },
    });

    if (!actor)
      return {
        items: [],
        nextCursor: null,
        last: false,
      };

    const [follows, total] = await this.followRepository.findAndCount({
      where: {
        followerId: actor.id,
        status: 'accepted',
      },
      relations: ['following', 'following.user', 'follower'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      items: follows.map((follow) => follow.following),
      nextCursor: (limit + offset).toString(),
      last: offset >= total,
    };
  }

  async getFollowers(
    identifier: string,
    pagination: PaginationParameter,
  ): Promise<PaginationResult<Actor>> {
    const { cursor, limit } = pagination;
    const offset = parseInt(cursor || '0');

    const actor = await this.actorRepository.findOne({
      where: { id: identifier },
    });

    if (!actor)
      return {
        items: [],
        nextCursor: null,
        last: false,
      };

    const [follows, total] = await this.followRepository.findAndCount({
      where: { status: 'accepted', followingId: actor.id },
      relations: ['following', 'follower', 'follower.user'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      items: follows.map((follow) => follow.follower),
      nextCursor: (limit + offset).toString(),
      last: offset >= total,
    };
  }
}
