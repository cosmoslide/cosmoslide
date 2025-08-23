import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MicrobloggingService } from './microblogging.service';
import { FollowService } from './services/follow.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class MicrobloggingController {
  constructor(
    private readonly microbloggingService: MicrobloggingService,
    private readonly followService: FollowService,
  ) {}

  @Post('notes')
  @UseGuards(JwtAuthGuard)
  async createNote(@Request() req: any, @Body() createNoteDto: CreateNoteDto) {
    return this.microbloggingService.createNote(req.user.id, createNoteDto);
  }

  @Get('notes/:id')
  async getNoteById(@Param('id') id: string) {
    return this.microbloggingService.getNoteById(id);
  }

  @Put('notes/:id')
  @UseGuards(JwtAuthGuard)
  async updateNote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.microbloggingService.updateNote(req.user.id, id, updateNoteDto);
  }

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@Request() req: any, @Param('id') id: string) {
    await this.microbloggingService.deleteNote(req.user.id, id);
  }

  @Get('users/:username/notes')
  async getUserNotes(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.microbloggingService.getUserNotes(username, limit, offset);
  }

  @Get('timeline/home')
  @UseGuards(JwtAuthGuard)
  async getHomeTimeline(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.microbloggingService.getHomeTimeline(
      req.user.id,
      limit,
      offset,
    );
  }

  @Get('timeline/public')
  async getPublicTimeline(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.microbloggingService.getPublicTimeline(limit, offset);
  }

  // Follow/Unfollow endpoints
  @Post('users/:username/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req: any, @Param('username') username: string) {
    return this.followService.followUser(req.user.id, username);
  }

  @Delete('users/:username/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req: any, @Param('username') username: string) {
    return this.followService.unfollowUser(req.user.id, username);
  }

  @Get('users/:username/follow-status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(
    @Request() req: any,
    @Param('username') username: string,
  ) {
    return this.followService.getFollowStatus(req.user.id, username);
  }

  @Get('users/:username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { last, nextCursor, items } = await this.followService.getFollowers(
      username,
      { cursor: (offset || 0).toString(), limit: limit || 10 },
    );
    return items;
  }

  @Get('users/:username/following')
  async getFollowing(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { last, nextCursor, items } = await this.followService.getFollowings(
      username,
      { cursor: (offset || 0).toString(), limit: limit || 10 },
    );
    return items;
  }
}
