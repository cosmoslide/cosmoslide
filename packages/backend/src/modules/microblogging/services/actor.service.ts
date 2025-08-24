import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
  ) {}

  async getActorByUserId(userId: string) {
    const actor = await this.actorRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    return actor;
  }

  async getActorByUsername(username: string) {
    const actor = await this.actorRepository.findOne({
      where: { preferredUsername: username },
    });

    return actor;
  }
}
