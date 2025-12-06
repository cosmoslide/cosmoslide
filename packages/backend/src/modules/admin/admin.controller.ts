import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Request admin magic link (public endpoint)
  @Public()
  @Post('auth/magic-link')
  async requestAdminMagicLink(@Body('email') email: string) {
    await this.adminService.requestAdminMagicLink(email);
    return { message: 'Magic link sent to your email' };
  }

  // Get all users with pagination
  @Get('users')
  async getAllUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.adminService.getAllUsers(page || 1, limit || 20);
  }

  // Create a new user
  @Post('users')
  async createUser(
    @Body()
    createUserDto: {
      email: string;
      username: string;
      displayName?: string;
    },
  ) {
    return await this.adminService.createUser(
      createUserDto.email,
      createUserDto.username,
      createUserDto.displayName,
    );
  }

  // Toggle admin status
  @Patch('users/:id/admin')
  async toggleAdminStatus(
    @Param('id') id: string,
    @Body('isAdmin', ParseBoolPipe) isAdmin: boolean,
  ) {
    return await this.adminService.toggleAdminStatus(id, isAdmin);
  }

  // Get all actors with pagination
  @Get('actors')
  async getAllActors(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('isLocal', new ParseBoolPipe({ optional: true })) isLocal?: boolean,
  ) {
    return await this.adminService.getAllActors(
      page || 1,
      limit || 20,
      isLocal,
    );
  }

  // Sync a single actor's ActivityPub information
  @Post('actors/:id/sync')
  async syncActor(@Param('id') id: string) {
    const actor = await this.adminService.syncActor(id);
    return {
      message: 'Actor synced successfully',
      actor,
    };
  }

  // Sync all local actors' ActivityPub information
  @Post('actors/sync-all')
  async syncAllLocalActors() {
    const result = await this.adminService.syncAllLocalActors();
    return {
      message: `Synced ${result.synced} actors`,
      ...result,
    };
  }

  // Fetch and persist a remote actor by ActivityPub URL
  @Post('actors/fetch')
  async fetchAndPersistActor(@Body('actorUrl') actorUrl: string) {
    const actor = await this.adminService.fetchAndPersistActor(actorUrl);
    return {
      message: 'Actor fetched and persisted successfully',
      actor,
    };
  }
}
