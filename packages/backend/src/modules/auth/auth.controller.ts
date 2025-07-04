import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('magic-link')
  async requestMagicLink(
    @Body('email') email: string,
    @Body('invitationCode') invitationCode?: string,
  ) {
    await this.authService.requestMagicLink(email, invitationCode);
    return { message: 'Magic link sent to your email' };
  }

  @Post('verify')
  async verifyMagicLink(
    @Query('token') token: string,
    @Body('username') username?: string,
    @Body('displayName') displayName?: string,
  ) {
    return await this.authService.verifyMagicLink(token, username, displayName);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return req.user;
  }
}
