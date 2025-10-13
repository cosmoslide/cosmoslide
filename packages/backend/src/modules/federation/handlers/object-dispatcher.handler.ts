import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Note } from '../../../entities';
import {
  Federation,
  Note as APNote,
  Announce as APAnnounce,
} from '@fedify/fedify';
import { NoteService } from 'src/modules/microblogging/services/note.service';
import { toAPAnnounce } from 'src/lib/activitypub';

@Injectable()
export class ObjectDispatcherHandler {
  constructor(private noteService: NoteService) {}

  setup(federation: Federation<unknown>) {
    federation.setObjectDispatcher(
      APNote,
      '/ap/notes/{noteId}',
      async (ctx, { noteId }) => {
        const note = await this.noteService.getNoteById(noteId);
        if (!note) return null;

        return new APNote({
          id: ctx.getObjectUri(APNote, { noteId }),
          content: note.content,
          // Many more properties...
        });
      },
    );

    federation.setObjectDispatcher(
      APAnnounce,
      '/ap/announces/{announceId}',
      async (ctx, { announceId }) => {
        const share = await this.noteService.getSharedNoteById(announceId);
        if (!share || !share.sharedNote || share.author.user) return null;

        return toAPAnnounce(ctx, share);
      },
    );
  }
}
