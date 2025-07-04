import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicrobloggingController } from './microblogging.controller';
import { MicrobloggingService } from './microblogging.service';
import { Note, User, Actor, Follow } from '../../entities';
import { FederationModule } from '../federation/federation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, User, Actor, Follow]),
    FederationModule,
  ],
  controllers: [MicrobloggingController],
  providers: [MicrobloggingService],
  exports: [MicrobloggingService],
})
export class MicrobloggingModule {}