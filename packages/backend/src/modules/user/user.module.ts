import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { KeyPair, User, Actor } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, KeyPair, Actor])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
