import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Note } from '../../../entities';
import { Federation, Note as APNote } from '@fedify/fedify';
import { NoteService } from 'src/modules/microblogging/services/note.service';

@Injectable()
export class ObjectDispatcherHandler {
  constructor(private noteService: NoteService) {}

  setup(federation: Federation<unknown>) {
    federation.setObjectDispatcher(
      APNote,
      '/notes/{noteId}',
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
  }
}
