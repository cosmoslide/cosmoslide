import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Post } from '../../../entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NodeInfoHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private configService: ConfigService,
  ) {}

  async handleNodeInfo(ctx: any) {
    // Get user statistics
    const totalUsers = await this.userRepository.count();
    const activeMonthUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    const activeHalfyearUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', {
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    // Get post count
    const localPosts = await this.postRepository.count();

    // Return fedify NodeInfo format with proper URL objects
    const importDynamic = new Function('specifier', 'return import(specifier)');
    const { parseSemVer } = await importDynamic('@fedify/fedify');

    return {
      software: {
        name: 'fedify-nestjs-showcase',
        version: parseSemVer('0.0.1'),
        homepage: new URL(
          'https://github.com/yourusername/fedify-nestjs-showcase',
        ),
        repository: new URL(
          'https://github.com/yourusername/fedify-nestjs-showcase',
        ),
      },
      protocols: ['activitypub'],
      services: {
        inbound: [],
        outbound: [],
      },
      usage: {
        users: {
          total: totalUsers,
          activeMonth: activeMonthUsers,
          activeHalfyear: activeHalfyearUsers,
        },
        localPosts,
        localComments: 0,
      },
      openRegistrations: true,
    };
  }
}
