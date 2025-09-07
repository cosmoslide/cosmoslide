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
  ForbiddenException,
} from '@nestjs/common';
import { FollowService } from './services/follow.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActorService } from './services/actor.service';
import { NoteService } from './services/note.service';
import { SearchService } from './services/search.service';
import { Actor, Note } from 'src/entities';
import { TimelineService } from './services/timeline.service';

@Controller()
export class MicrobloggingController {
  constructor(
    private readonly followService: FollowService,
    private readonly actorService: ActorService,
    private readonly noteService: NoteService,
    private readonly searchService: SearchService,
    private readonly timelineService: TimelineService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') query: string) {
    if (!query) {
      return { users: [], notes: [] };
    }
    const result = await this.searchService.search(query);
    if (result instanceof Actor)
      return {
        users: [
          {
            id: result.id,
            preferredUsername: result.preferredUsername,
            name: result.name,
            summary: result.summary,
            acct: result.acct,
            url: result.url,
            manuallyApprovesFollowers: result.manuallyApprovesFollowers,
          },
        ],
      };
    if (result instanceof Note)
      return {
        notes: [result],
      };

    return {
      users: [],
      notes: [],
    };
  }

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
    const note = await this.noteService.getNoteById(id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Transform to include username format the frontend expects
    return {
      ...note,
      author: {
        ...note.author,
        id: note.author?.id,
        username: note.author?.preferredUsername,
        displayName: note.author?.name,
      },
    };
  }

  @Put('notes/:id')
  @UseGuards(JwtAuthGuard)
  async updateNote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {}

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@Request() req: any, @Param('id') id: string) {}

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

    const timelinePosts = await this.timelineService.getHomeTimeline(actor);

    // Transform notes to include username format the frontend expects
    const transformedNotes = timelinePosts.map((timelinePost) => ({
      ...timelinePost.note,
      author: {
        ...timelinePost.author,
        username: timelinePost.author?.preferredUsername,
        displayName: timelinePost.author?.name,
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
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
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
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
      // Add user counts if available through relation
      followersCount: actor.user?.followersCount || 0,
      followingCount: actor.user?.followingsCount || 0,
    }));
  }

  @Get('users/:username/follow-requests')
  @UseGuards(JwtAuthGuard)
  async getFollowRequests(
    @Request() req: any,
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const currentActor = await this.actorService.getActorByUserId(req.user.id);
    if (!currentActor) {
      throw new NotFoundException('Actor not found');
    }

    if (currentActor.preferredUsername !== username) {
      throw new ForbiddenException('Forbidden');
    }

    const { last, nextCursor, items } =
      await this.followService.getFollowRequests(username, {
        cursor: (offset || 0).toString(),
        limit: limit || 10,
      });

    return items.map((actor) => ({
      username: actor.preferredUsername,
      displayName: actor.name,
      bio: actor.summary,
      // Add user counts if available through relation
      followersCount: actor.user?.followersCount || 0,
      followingCount: actor.user?.followingsCount || 0,
    }));
  }

  @Post('users/:username/follow-requests/:requesterUsername/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFollowRequest(
    @Request() req: any,
    @Param('username') username: string,
    @Param('requesterUsername') requesterUsername: string,
  ) {
    const currentActor = await this.actorService.getActorByUserId(req.user.id);
    if (!currentActor) {
      throw new NotFoundException('Actor not found');
    }

    if (currentActor.preferredUsername !== username) {
      throw new ForbiddenException('Forbidden');
    }

    const requesterActor =
      await this.actorService.getActorByUsername(requesterUsername);
    if (!requesterActor) {
      throw new NotFoundException('Requester not found');
    }

    await this.followService.sendAcceptFollowRequest(
      requesterActor,
      currentActor,
    );
    return { success: true };
  }

  @Post('users/:username/follow-requests/:requesterUsername/reject')
  @UseGuards(JwtAuthGuard)
  async rejectFollowRequest(
    @Request() req: any,
    @Param('username') username: string,
    @Param('requesterUsername') requesterUsername: string,
  ) {
    const currentActor = await this.actorService.getActorByUserId(req.user.id);
    if (!currentActor) {
      throw new NotFoundException('Actor not found');
    }

    if (currentActor.preferredUsername !== username) {
      throw new ForbiddenException('Forbidden');
    }

    const requesterActor =
      await this.actorService.getActorByUsername(requesterUsername);
    if (!requesterActor) {
      throw new NotFoundException('Requester not found');
    }

    await this.followService.sendRejectFollowRequest(
      requesterActor,
      currentActor,
    );
    return { success: true };
  }
}
