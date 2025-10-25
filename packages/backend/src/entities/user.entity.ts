import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Follow } from './follow.entity';
import { Actor } from './actor.entity';
import { KeyPair } from './keypair.entity';

export enum PostVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  FOLLOWERS = 'followers',
  DIRECT = 'direct',
}

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

  @Column({ default: false })
  isAdmin: boolean;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  defaultVisibility: PostVisibility;

  // Relationship for followers (users who follow this user)
  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  // Relationship for following (users this user follows)
  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  // One-to-one relationship with Actor
  @OneToOne(() => Actor, (actor) => actor.user)
  actor: Actor;

  // One-to-many relationship with KeyPairs
  @OneToMany(() => KeyPair, (keyPair) => keyPair.user)
  keyPairs: KeyPair[];

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingsCount: number;

  @Column({ default: 0 })
  notesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get actorId(): string {
    return `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_HANDLE_DOMAIN}/ap/actors/${this.actor.id}`;
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
