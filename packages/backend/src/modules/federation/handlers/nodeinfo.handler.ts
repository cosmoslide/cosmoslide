import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Note } from '../../../entities';
import { ConfigService } from '@nestjs/config';
import { Federation, parseSemVer, RequestContext } from '@fedify/fedify';

@Injectable()
export class NodeInfoHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private configService: ConfigService,
  ) { }

  async handleNodeInfo(ctx: RequestContext<unknown>) {
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
    const localPosts = await this.noteRepository.count();

    // Return fedify NodeInfo format with proper URL objects

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
