import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Actor } from './actor.entity';
import { TimelinePost } from './timeline-post.entity';
import { Mention } from './mention.entity';
import { Tag } from './tag.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  content: string;

  @Column('text', { nullable: true })
  source: string;

  @Column({ default: 'text/plain' })
  mediaType: string;

  @Column({ nullable: true })
  contentWarning: string;

  @ManyToOne(() => Actor, (actor) => actor.notes)
  @JoinColumn({ name: 'authorId' })
  author: Actor;

  @OneToOne(() => TimelinePost, (timelinePost) => timelinePost.note)
  timelinePost: TimelinePost;

  @Column('uuid', { nullable: true })
  authorId: string;

  @Column({ nullable: true })
  iri: string;

  @Column({ nullable: true })
  inReplyToId: string;

  @Column({ nullable: true })
  inReplyToUri: string;

  @Column({ nullable: true })
  sharedNoteId: string;

  @ManyToOne(() => Note)
  @JoinColumn({ name: 'sharedNoteId' })
  sharedNote: Note;

  @Column({ default: 'public' })
  visibility: 'public' | 'unlisted' | 'followers' | 'direct' | 'none';

  @Column({ default: false })
  sensitive: boolean;

  @Column('jsonb', { nullable: true, default: [] })
  attachments: Array<{
    type: string;
    url: string;
    mediaType: string;
    name?: string;
  }>;

  @Column('jsonb', { nullable: true, default: [] })
  tags: Array<{
    type: string;
    name: string;
    href?: string;
  }>;

  @OneToMany(() => Mention, (mention) => mention.note)
  mentions: Mention[];

  @ManyToMany(() => Tag, (tag) => tag.notes)
  @JoinTable({
    name: 'note_tags',
    joinColumn: { name: 'noteId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tagEntities: Tag[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  sharesCount: number;

  @Column({ default: 0 })
  repliesCount: number;

  @Column({ nullable: true })
  activityId: string;

  @Column({ nullable: true })
  url: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  get noteUrl(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_HANDLE_DOMAIN}/notes/${this.id}`;
  }

  get activityUrl(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_HANDLE_DOMAIN}/activities/${this.id}`;
  }
}
