import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Note } from './note.entity';
import { Follow } from './follow.entity';
import { Actor } from './actor.entity';

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

  @OneToMany(() => Note, (note) => note.author)
  notes: Note[];

  // Relationship for followers (users who follow this user)
  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  // Relationship for following (users this user follows)
  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  // One-to-one relationship with Actor
  @OneToOne(() => Actor, (actor) => actor.user)
  actor: Actor;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @Column({ default: 0 })
  notesCount: number;

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
