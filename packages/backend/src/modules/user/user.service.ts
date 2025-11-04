import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyAlgorithm, KeyPair, User, Actor } from '../../entities';
import { exportJwk, generateCryptoKeyPair, Federation } from '@fedify/fedify';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';
import { toUpdatePersonActivity } from '../../lib/activitypub';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @Inject(FEDIFY_FEDERATION)
    private federation: Federation<unknown>,
  ) {}

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user entity
    await this.userRepository.update(user.id, data);

    // Update actor entity's summary if bio is being updated
    if (user.actor && data.bio !== undefined) {
      await this.actorRepository.update(user.actor.id, {
        summary: data.bio,
      });
    }

    // Reload user with actor for federation
    const reloadedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!reloadedUser) {
      throw new NotFoundException('User not found after update');
    }

    // Send Update activity to federation
    if (reloadedUser.actor) {
      try {
        const ctx = this.federation.createContext(
          new URL(process.env.FEDERATION_ORIGIN || ''),
          undefined,
        );

        const updateActivity = await toUpdatePersonActivity(
          ctx,
          reloadedUser.actor,
        );

        await ctx.sendActivity(
          { identifier: reloadedUser.actor.id },
          'followers',
          updateActivity,
          {
            preferSharedInbox: true,
            excludeBaseUris: [new URL(ctx.canonicalOrigin)],
          },
        );
      } catch (error) {
        console.error('Failed to send profile update activity:', error);
        // Don't fail the request if federation fails
      }
    }

    return reloadedUser;
  }

  async updatePrivacySettings(
    userId: string,
    privacyData: { isLocked?: boolean },
  ): Promise<{ success: boolean; isLocked: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.actor) {
      throw new NotFoundException('Actor not found for user');
    }

    // Update the actor's manuallyApprovesFollowers field
    if (privacyData.isLocked !== undefined) {
      await this.actorRepository.update(user.actor.id, {
        manuallyApprovesFollowers: privacyData.isLocked,
      });
    }

    // Return the updated status
    const updatedActor = await this.actorRepository.findOne({
      where: { id: user.actor.id },
    });

    return {
      success: true,
      isLocked: updatedActor?.manuallyApprovesFollowers || false,
    };
  }

  async generateKeyPairs(userId: string): Promise<KeyPair[]> {
    const user = await this.findById(userId);

    const keyPairs: KeyPair[] = [];

    for (const algorithm of [KeyAlgorithm.RSA, KeyAlgorithm.Ed25519] as const) {
      const { privateKey, publicKey } = await generateCryptoKeyPair(algorithm);
      const keyPair = this.keyPairRepository.create({
        user,
        algorithm,
        publicKey: JSON.stringify(await exportJwk(publicKey)),
        privateKey: JSON.stringify(await exportJwk(privateKey)),
      });

      keyPairs.push(await this.keyPairRepository.save(keyPair));
    }

    return keyPairs;
  }

  async getUserStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    const user = await this.findById(userId);

    return {
      postsCount: user.notesCount,
      followersCount: user.followersCount,
      followingCount: user.followingsCount,
    };
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user entity's avatarUrl
    await this.userRepository.update(user.id, { avatarUrl });

    // Update actor entity's icon
    if (user.actor) {
      const iconData = {
        type: 'Image',
        mediaType: 'image/jpeg',
        url: avatarUrl,
      };

      await this.actorRepository.update(user.actor.id, {
        icon: iconData,
      });
    }

    // Reload user with actor for federation
    const reloadedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['actor'],
    });

    if (!reloadedUser) {
      throw new NotFoundException('User not found after update');
    }

    // Send Update activity to federation
    if (reloadedUser.actor) {
      try {
        const ctx = this.federation.createContext(
          new URL(process.env.FEDERATION_ORIGIN || ''),
          undefined,
        );

        const updateActivity = await toUpdatePersonActivity(
          ctx,
          reloadedUser.actor,
        );

        await ctx.sendActivity(
          { identifier: reloadedUser.actor.id },
          'followers',
          updateActivity,
          {
            preferSharedInbox: true,
            excludeBaseUris: [new URL(ctx.canonicalOrigin)],
          },
        );
      } catch (error) {
        console.error('Failed to send avatar update activity:', error);
        // Don't fail the request if federation fails
      }
    }

    return reloadedUser;
  }

  async getPublicProfile(username: string): Promise<{
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    headerUrl: string | null;
    isBot: boolean;
    isLocked: boolean;
    manuallyApprovesFollowers: boolean;
    defaultVisibility: string;
    postsCount: number;
    followersCount: number;
    followingCount: number;
    createdAt: Date;
    actorId: string;
    inboxUrl: string;
    outboxUrl: string;
    followersUrl: string;
    followingUrl: string;
  }> {
    const user = await this.findByUsername(username);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      headerUrl: user.headerUrl,
      isBot: user.isBot,
      isLocked: user.isLocked,
      manuallyApprovesFollowers: user.actor?.manuallyApprovesFollowers || false,
      defaultVisibility: user.defaultVisibility,
      postsCount: user.notesCount,
      followersCount: user.followersCount,
      followingCount: user.followingsCount,
      createdAt: user.createdAt,
      actorId: user.actorId,
      inboxUrl: user.inboxUrl,
      outboxUrl: user.outboxUrl,
      followersUrl: user.followersUrl,
      followingUrl: user.followingUrl,
    };
  }
}
