import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request as ERequest } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PresentationService } from '../presentation/presentation.service';
import { PostVisibility } from '../../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private presentationService: PresentationService,
  ) {}

  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    return await this.userService.getPublicProfile(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateCurrentUser(
    @Request() req: ERequest,
    @Body()
    updateData: {
      displayName?: string;
      bio?: string;
      email?: string;
      defaultVisibility?: PostVisibility;
    },
  ) {
    return await this.userService.updateProfile(req.user!.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/privacy')
  async updatePrivacySettings(
    @Request() req: ERequest,
    @Body()
    privacyData: {
      isLocked?: boolean;
    },
  ) {
    return await this.userService.updatePrivacySettings(
      req.user!.id,
      privacyData,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  async updateAvatar(
    @Request() req: ERequest,
    @Body()
    avatarData: {
      avatarUrl: string;
    },
  ) {
    return await this.userService.updateAvatar(
      req.user!.id,
      avatarData.avatarUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username/stats')
  async getUserStats(
    @Request() req: ERequest,
    @Param('username') username: string,
  ) {
    const user = await this.userService.findByUsername(username);

    // Only allow users to see their own detailed stats
    if (user.id !== req.user!.id) {
      throw new UnauthorizedException('You can only view your own stats');
    }

    return await this.userService.getUserStats(user.id);
  }

  @Get(':username/presentations')
  async getUserPresentations(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);
    const presentations = await this.presentationService.findByUserId(user.id);

    return presentations.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      pdfKey: p.pdfKey,
      noteId: p.noteId,
      createdAt: p.createdAt,
    }));
  }
}
