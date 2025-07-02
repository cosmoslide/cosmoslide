import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 1 })
  maxUses: number;

  @Column({ default: 0 })
  usedCount: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Column()
  invitedById: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  get isValid(): boolean {
    if (this.usedCount >= this.maxUses) return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    return true;
  }
}