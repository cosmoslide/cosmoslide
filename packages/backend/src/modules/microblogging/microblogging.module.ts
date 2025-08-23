import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicrobloggingController } from './microblogging.controller';
import { MicrobloggingService } from './microblogging.service';
import { FollowService } from './services/follow.service';
import { Note, User, Actor, Follow } from '../../entities';
import { FederationModule } from '../federation/federation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, User, Actor, Follow]),
    FederationModule,
  ],
  controllers: [MicrobloggingController],
  providers: [MicrobloggingService, FollowService],
  exports: [MicrobloggingService, FollowService],
})
export class MicrobloggingModule {}
