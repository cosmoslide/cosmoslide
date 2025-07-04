import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async getUserStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    const user = await this.findById(userId);

    return {
      postsCount: user.postsCount,
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
      postsCount: user.postsCount,
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
