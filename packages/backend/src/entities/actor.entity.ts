import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';

@Entity('actors')
@Index(['actorId'], { unique: true })
@Index(['preferredUsername', 'domain'])
export class Actor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    nullable: true,
  })
  actorId: string; // The ActivityPub ID (URL)

  @Column({ nullable: true })
  iri: string;

  @Column({ nullable: true })
  acct: string;

  @Column()
  preferredUsername: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  summary: string;

  @Column({ nullable: true })
  url: string;

  @Column('jsonb', { nullable: true })
  icon: {
    type: string;
    mediaType?: string;
    url: string;
  };

  @Column('jsonb', { nullable: true })
  image: {
    type: string;
    mediaType?: string;
    url: string;
  };

  @Column({ nullable: true })
  inboxUrl: string;

  @Column({ nullable: true })
  outboxUrl: string;

  @Column({ nullable: true })
  sharedInboxUrl: string;

  @Column({ nullable: true })
  followersUrl: string; // URL to the followers collection endpoint

  @Column({ nullable: true })
  followingUrl: string; // URL to the following collection endpoint

  @Column({ default: false })
  manuallyApprovesFollowers: boolean;

  @Column({ default: 'Person' })
  type: string; // Person, Service, Application, etc.

  @Column()
  domain: string; // The domain (local or remote)

  @Column({ default: false })
  isLocal: boolean; // True for local actors, false for remote

  // For local actors, link to the user
  @OneToOne(() => User, (user) => user.actor)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @OneToMany(() => Note, (note) => note.author)
  notes: Note[];

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastFetchedAt: Date; // For remote actors, when we last fetched their data
}
