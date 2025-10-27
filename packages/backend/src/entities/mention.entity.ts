import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actor } from './actor.entity';
import { Note } from './note.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Actor, (actor) => actor.mentions)
  actor: Actor;

  @ManyToOne(() => Note, (note) => note.mentions)
  note: Note;
}
