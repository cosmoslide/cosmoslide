import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyAlgorithm, KeyPair, User, Actor } from '../../entities';
import { exportJwk, generateCryptoKeyPair } from '@fedify/fedify';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
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
    const user = await this.findById(userId);

    await this.userRepository.update(user.id, data);

    const reloadedUser = await this.findById(userId);
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
