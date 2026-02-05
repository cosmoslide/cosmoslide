import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Follow, Actor } from '../../../entities';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RemoteActorResolverService } from '../../federation/services/remote-actor-resolver.service';
import {
  FollowRequestedEvent,
  UnfollowRequestedEvent,
  FollowAcceptedEvent,
  FollowRejectedEvent,
} from '../events/domain-events';

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

    private remoteActorResolver: RemoteActorResolverService,
    private eventEmitter: EventEmitter2,
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

    // Look up target locally first
    const targetActor = await this.actorRepository.findOne({
      where: [{ preferredUsername: targetUsername }, { acct: targetUsername }],
    });

    // Resolve remote actor for federation
    const federationDomain = process.env.FEDERATION_HANDLE_DOMAIN;
    const targetAcct = targetUsername.slice(1).includes('@')
      ? targetUsername
      : `@${targetUsername}@${federationDomain}`;

    const resolvedActor = await this.remoteActorResolver.resolveActor(
      targetAcct.trim(),
    );
    if (!resolvedActor) {
      return {
        success: false,
        message: 'Invalid actor handle or URL',
      };
    }

    // Determine the target's ActivityPub IRI for federation
    const targetActorIri = resolvedActor.actorId || resolvedActor.iri;
    const targetInboxUrl = resolvedActor.inboxUrl;

    if (!targetActor) {
      // Remote-only actor: emit follow event for federation, no local DB record
      this.eventEmitter.emit(
        'follow.requested',
        new FollowRequestedEvent(followerActor, targetActorIri, targetInboxUrl),
      );
      return { success: true, message: 'Request to follow!' };
    }

    // Local actor: create follow record then emit federation event
    const follow = await this.followActor(followerActor, targetActor);
    if (!follow) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    this.eventEmitter.emit(
      'follow.requested',
      new FollowRequestedEvent(followerActor, targetActorIri, targetInboxUrl),
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

    if (!targetActor) {
      // Remote-only: resolve and send Undo(Follow)
      const resolvedActor = await this.remoteActorResolver.resolveActor(
        targetUsername.trim(),
      );
      if (!resolvedActor) {
        return {
          success: false,
          message: 'Invalid actor handle or URL',
        };
      }

      const targetActorIri = resolvedActor.actorId || resolvedActor.iri;
      const targetInboxUrl = resolvedActor.inboxUrl;

      this.eventEmitter.emit(
        'unfollow.requested',
        new UnfollowRequestedEvent(
          followerActor,
          targetActorIri,
          targetInboxUrl,
        ),
      );

      return { success: true, message: 'Request to unfollow sent!' };
    }

    // Emit Undo(Follow) event before local DB removal
    const targetActorIri = targetActor.actorId;
    const targetInboxUrl = targetActor.inboxUrl;

    this.eventEmitter.emit(
      'unfollow.requested',
      new UnfollowRequestedEvent(followerActor, targetActorIri, targetInboxUrl),
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

    // Emit event for federation layer to send Accept activity
    this.eventEmitter.emit(
      'follow.accepted',
      new FollowAcceptedEvent(targetActor, requestedActor, follow),
    );

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

    // Emit event for federation layer to send Reject activity
    this.eventEmitter.emit(
      'follow.rejected',
      new FollowRejectedEvent(targetActor, requestedActor, follow),
    );

    return true;
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

  /**
   * Create a mutual follow between two local users (both directions immediately accepted)
   */
  async createMutualFollow(user1: User, user2: User): Promise<void> {
    // Get actors for both users
    const actor1 = await this.actorRepository.findOne({
      where: { userId: user1.id },
    });
    const actor2 = await this.actorRepository.findOne({
      where: { userId: user2.id },
    });

    if (!actor1 || !actor2) {
      return;
    }

    // Create follow from user1 -> user2
    const follow1to2 = await this.followRepository.findOne({
      where: { followerId: actor1.id, followingId: actor2.id },
    });
    if (!follow1to2) {
      const newFollow = this.followRepository.create({
        follower: actor1,
        following: actor2,
        status: 'accepted',
        acceptedAt: new Date(),
      });
      await this.followRepository.save(newFollow);
      await this.userRepository.increment(
        { id: user2.id },
        'followersCount',
        1,
      );
      await this.userRepository.increment(
        { id: user1.id },
        'followingsCount',
        1,
      );
    }

    // Create follow from user2 -> user1
    const follow2to1 = await this.followRepository.findOne({
      where: { followerId: actor2.id, followingId: actor1.id },
    });
    if (!follow2to1) {
      const newFollow = this.followRepository.create({
        follower: actor2,
        following: actor1,
        status: 'accepted',
        acceptedAt: new Date(),
      });
      await this.followRepository.save(newFollow);
      await this.userRepository.increment(
        { id: user1.id },
        'followersCount',
        1,
      );
      await this.userRepository.increment(
        { id: user2.id },
        'followingsCount',
        1,
      );
    }
  }
}
