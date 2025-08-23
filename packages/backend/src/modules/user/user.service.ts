import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyAlgorithm, KeyPair, User } from '../../entities';
import { exportJwk, generateCryptoKeyPair } from '@fedify/fedify';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,
  ) {}

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
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

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      headerUrl?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);

    Object.assign(user, data);

    return await this.userRepository.save(user);
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
      followingCount: user.followingCount,
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
      postsCount: user.notesCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      createdAt: user.createdAt,
      actorId: user.actorId,
      inboxUrl: user.inboxUrl,
      outboxUrl: user.outboxUrl,
      followersUrl: user.followersUrl,
      followingUrl: user.followingUrl,
    };
  }
}
