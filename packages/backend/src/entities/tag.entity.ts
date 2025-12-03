import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @ManyToMany(() => Note, (note) => note.tagEntities)
  notes: Note[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
