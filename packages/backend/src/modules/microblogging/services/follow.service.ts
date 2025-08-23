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
} from '@fedify/fedify';

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
      where: { preferredUsername: targetUsername },
    });

    const federationOrigin = process.env.FEDERATION_ORIGIN;
    const ctx = this.federation.createContext(
      new URL(federationOrigin ?? ''),
      undefined,
    );

    console.log({ targetUsername });
    // const targetAcct = `@${targetUsername.trim()}@${process.env.FEDERATION_DOMAIN}`;
    const targetAcct = `@dubonus_ladinut@activitypub.academy`;
    const actor = await lookupObject(targetAcct.trim());
    if (!isActor(actor)) {
      return {
        success: false,
        message: 'Invalid actor handle or URL',
      };
    }
    const apFollowObject = new APFollow({
      actor: ctx.getActorUri(followerActor.preferredUsername),
      object: actor.id,
      to: actor.id,
    });

    console.log({
      id: ctx.getActorUri(targetUsername),
      inboxId: ctx.getInboxUri(targetUsername),
    });

    if (!targetActor) {
      const followRequestResult = await ctx.sendActivity(
        {
          username: followerActor.preferredUsername,
        },
        actor,
        apFollowObject,
        {
          immediate: true,
        },
      );

      console.log({ followRequestResult });

      return { success: true, message: 'Request to follow!' };
    }

    const follow = await this.followActor(followerActor, targetActor);
    if (!follow) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    const followRequestResult = await ctx.sendActivity(
      {
        username: followerActor.preferredUsername,
      },
      actor,
      apFollowObject,
      { immediate: true },
    );

    console.log({ followRequestResult });

    return { success: true, message: 'Successfully followed user' };
  }

  async unfollowUser(
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
      where: { preferredUsername: targetUsername },
    });

    const federationOrigin = process.env.FEDERATION_ORIGIN;
    const ctx = this.federation.createContext(
      new URL(federationOrigin ?? ''),
      undefined,
    );

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
        actor: ctx.getActorUri(followerActor.preferredUsername),
        object: actor.id,
      });

      await ctx.sendActivity(
        {
          username: followerActor.preferredUsername,
        },
        {
          id: ctx.getActorUri(targetUsername),
          inboxId: ctx.getInboxUri(targetUsername),
        },
        new Undo(followActivity),
        {
          immediate: true,
        },
      );

      return { success: true, message: 'Request to unfollow sent!' };
    }

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

    return follow;
  }

  async unfollowActor(followerActor: Actor, followingActor: Actor) {
    const follow = await this.followRepository.findOne({
      where: {
        follower: followerActor,
        following: followingActor,
      },
    });

    if (!follow) {
      return null;
    }

    await this.followRepository.remove(follow);

    await this.userRepository.decrement(
      { id: followingActor.user.id },
      'followersCount',
      1,
    );

    await this.userRepository.decrement(
      { id: followerActor.user.id },
      'followingsCount',
      1,
    );

    return true;
  }

  async acceptFollowRequest(requestedActor: Actor, targetActor: Actor) {
    let follow = await this.followRepository.findOne({
      where: {
        follower: requestedActor,
        following: targetActor,
      },
    });

    if (!follow) return null;

    await this.followRepository.update(follow, {
      status: 'accepted',
      acceptedAt: Date.now(),
    });

    await this.userRepository.increment(
      { id: targetActor.user.id },
      'followersCount',
      1,
    );

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
        follower: requestedActor,
        following: targetActor,
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
  ): Promise<{ isFollowing: boolean }> {
    try {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
      });

      const targetUser = await this.userRepository.findOne({
        where: { username: targetUsername },
      });

      if (!currentUser || !targetUser) {
        return { isFollowing: false };
      }

      if (currentUser.id === targetUser.id) {
        return { isFollowing: false };
      }

      const followerActor = await this.actorRepository.findOne({
        where: { userId: currentUser.id },
      });

      const targetActor = await this.actorRepository.findOne({
        where: { userId: targetUser.id },
      });

      if (!followerActor || !targetActor) {
        return { isFollowing: false };
      }

      const follow = await this.followRepository.findOne({
        where: {
          followerId: followerActor.id,
          followingId: targetActor.id,
        },
      });

      return { isFollowing: !!follow };
    } catch (error) {
      return { isFollowing: false };
    }
  }

  async getFollowers(
    username: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    followers: any[];
    total: number;
  }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actor = await this.actorRepository.findOne({
      where: { userId: user.id },
    });

    if (!actor) {
      return { followers: [], total: 0 };
    }

    const [followers, total] = await this.followRepository.findAndCount({
      where: { followingId: actor.id },
      relations: ['follower'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      followers: followers.map((f) => ({
        username: f.follower.preferredUsername,
        displayName: f.follower.name,
        followedAt: f.createdAt,
      })),
      total,
    };
  }

  async getFollowing(
    username: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    following: any[];
    total: number;
  }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actor = await this.actorRepository.findOne({
      where: { userId: user.id },
    });

    if (!actor) {
      return { following: [], total: 0 };
    }

    const [following, total] = await this.followRepository.findAndCount({
      where: { followerId: actor.id },
      relations: ['following'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      following: following.map((f) => ({
        username: f.following.preferredUsername,
        displayName: f.following.name,
        followedAt: f.createdAt,
      })),
      total,
    };
  }
}
