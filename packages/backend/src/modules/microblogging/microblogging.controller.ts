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
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class MicrobloggingController {
  constructor(private readonly microbloggingService: MicrobloggingService) {}

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
    return this.microbloggingService.getHomeTimeline(req.user.id, limit, offset);
  }

  @Get('timeline/public')
  async getPublicTimeline(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.microbloggingService.getPublicTimeline(limit, offset);
  }
}