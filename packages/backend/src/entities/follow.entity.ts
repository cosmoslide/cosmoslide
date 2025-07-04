import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who is following
  @ManyToOne(() => User)
  @JoinColumn()
  follower: User;

  @Column()
  followerId: string;

  // The user being followed
  @ManyToOne(() => User)
  @JoinColumn()
  following: User;

  @Column()
  followingId: string;

  @Column({ default: 'pending' })
  status: string; // pending, accepted, rejected

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;
}
