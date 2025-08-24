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
  Response,
  NotFoundException,
} from '@nestjs/common';
import { MicrobloggingService } from './microblogging.service';
import { FollowService } from './services/follow.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActorService } from './services/actor.service';
import { NoteService } from './services/note.service';

@Controller()
export class MicrobloggingController {
  constructor(
    private readonly microbloggingService: MicrobloggingService,
    private readonly followService: FollowService,
    private readonly actorService: ActorService,
    private readonly noteService: NoteService,
  ) {}

  @Post('notes')
  @UseGuards(JwtAuthGuard)
  async createNote(@Request() req: any, @Body() createNoteDto: CreateNoteDto) {
    const actor = await this.actorService.getActorByUserId(req.user.id);
    if (!actor) {
      throw NotFoundException;
    }
    return this.noteService.createNote(actor, createNoteDto);
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
    const actor = await this.actorService.getActorByUsername(username);
    if (!actor) {
      throw new NotFoundException('User not found');
    }
    const notes = await this.noteService.getNotesAuthoredBy({
      actor,
    });

    // Transform notes to include username format the frontend expects
    const transformedNotes = notes.map((note) => ({
      ...note,
      author: {
        ...note.author,
        username: note.author?.preferredUsername,
        displayName: note.author?.name,
      },
    }));

    // Return in the format the frontend expects
    return {
      notes: transformedNotes || [],
      total: transformedNotes?.length || 0,
    };
  }

  @Get('timeline/home')
  @UseGuards(JwtAuthGuard)
  async getHomeTimeline(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const actor = await this.actorService.getActorByUserId(req.user.id);
    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const notes = await this.noteService.getHomeTimelineNotes({
      actor,
      cursor: (offset || 0).toString(),
      limit: limit || 20,
    });

    // Transform notes to include username format the frontend expects
    const transformedNotes = notes.map((note) => ({
      ...note,
      author: {
        ...note.author,
        username: note.author?.preferredUsername,
        displayName: note.author?.name,
      },
    }));

    return {
      notes: transformedNotes || [],
      total: transformedNotes?.length || 0,
    };
  }

  @Get('timeline/public')
  async getPublicTimeline(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const notes = await this.noteService.getPublicTimelineNotes({ limit });

    // Transform notes to include username format the frontend expects
    const transformedNotes = notes.map((note) => ({
      ...note,
      author: {
        ...note.author,
        username: note.author?.preferredUsername,
        displayName: note.author?.name,
      },
    }));

    return {
      notes: transformedNotes || [],
    };
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
    // Transform Actor entities to user-friendly format
    return items.map((actor) => ({
      username: actor.preferredUsername,
      displayName: actor.name,
      bio: actor.summary,
      // Add user counts if available through relation
      followersCount: actor.user?.followersCount || 0,
      followingCount: actor.user?.followingsCount || 0,
    }));
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
    // Transform Actor entities to user-friendly format
    return items.map((actor) => ({
      username: actor.preferredUsername,
      displayName: actor.name,
      bio: actor.summary,
      // Add user counts if available through relation
      followersCount: actor.user?.followersCount || 0,
      followingCount: actor.user?.followingsCount || 0,
    }));
  }
}
