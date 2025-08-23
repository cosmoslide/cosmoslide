import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Actor } from './actor.entity';

@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who is following
  @ManyToOne(() => Actor)
  @JoinColumn({ name: 'followerId' })
  follower: Actor;

  @Column({ nullable: true })
  followerId: string;

  // The user being followed
  @ManyToOne(() => Actor)
  @JoinColumn({ name: 'followingId' })
  following: Actor;

  @Column({ nullable: true })
  followingId: string;

  @Column({ default: 'pending' })
  status: string; // pending, accepted, rejected

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;
}
