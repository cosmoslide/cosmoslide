import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebFingerHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async setup(federation: any) {
    // WebFinger is typically handled differently
    // It might be set up as a separate endpoint or through the federation
    console.log('WebFinger handler setup');
  }

  async handleWebFinger(resource: string) {
    // Parse the resource parameter (e.g., "acct:username@domain.com")
    const match = resource.match(/^acct:([^@]+)@(.+)$/);
    if (!match) return null;

    const [, username, domain] = match;
    const expectedDomain = this.configService.get('FEDERATION_DOMAIN');
    
    if (domain !== expectedDomain) return null;

    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) return null;

    return {
      subject: resource,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: user.actorId,
        },
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: user.actorId,
        },
      ],
    };
  }
}