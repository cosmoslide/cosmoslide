import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Actor } from './actor.entity';
import { Note } from './note.entity';

@Entity('timeline_posts')
export class TimelinePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Actor, (actor) => actor.timelinePosts)
  @JoinColumn({ name: 'authorId ' })
  author: Actor;

  @Column('uuid', { nullable: true })
  authorId: string;

  @OneToOne(() => Note, (note) => note.timelinePost)
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column('uuid', { nullable: true })
  noteId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
