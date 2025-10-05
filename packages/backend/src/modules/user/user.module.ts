import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { KeyPair, User, Actor } from '../../entities';
import { PresentationModule } from '../presentation/presentation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, KeyPair, Actor]),
    PresentationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
