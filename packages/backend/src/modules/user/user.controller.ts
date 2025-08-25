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
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    return await this.userService.getPublicProfile(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateCurrentUser(
    @Request() req,
    @Body()
    updateData: {
      displayName?: string;
      bio?: string;
      email?: string;
    },
  ) {
    return await this.userService.updateProfile(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username/stats')
  async getUserStats(@Request() req, @Param('username') username: string) {
    const user = await this.userService.findByUsername(username);

    // Only allow users to see their own detailed stats
    if (user.id !== req.user.id) {
      throw new UnauthorizedException('You can only view your own stats');
    }

    return await this.userService.getUserStats(user.id);
  }
}
