import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  contentWarning: string;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('uuid')
  authorId: string;

  @Column({ nullable: true })
  inReplyToId: string;

  @Column({ default: 'public' })
  visibility: 'public' | 'unlisted' | 'followers' | 'direct';

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

  @Column('jsonb', { nullable: true, default: [] })
  mentions: Array<{
    type: string;
    href: string;
    name: string;
  }>;

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

  get postUrl(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}/posts/${this.id}`;
  }

  get activityUrl(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}/activities/${this.id}`;
  }
}