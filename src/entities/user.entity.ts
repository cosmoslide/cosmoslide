import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  headerUrl: string;

  @Column({ default: false })
  isBot: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column('jsonb', { nullable: true })
  publicKey: {
    id: string;
    publicKeyPem: string;
  };

  @Column('text', { nullable: true })
  privateKey: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @Column({ default: 0 })
  postsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get actorId(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}/actors/${this.username}`;
  }

  get inboxUrl(): string {
    return `${this.actorId}/inbox`;
  }

  get outboxUrl(): string {
    return `${this.actorId}/outbox`;
  }

  get followersUrl(): string {
    return `${this.actorId}/followers`;
  }

  get followingUrl(): string {
    return `${this.actorId}/following`;
  }
}