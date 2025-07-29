import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Actor } from './actor.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who is following
  @ManyToOne(() => Actor)
  @JoinColumn()
  follower: Actor;

  @Column()
  followerId: string;

  // The user being followed
  @ManyToOne(() => Actor)
  @JoinColumn()
  following: Actor;

  @Column()
  followingId: string;

  @Column({ default: 'pending' })
  status: string; // pending, accepted, rejected

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;
}
