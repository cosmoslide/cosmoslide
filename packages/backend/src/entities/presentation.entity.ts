import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('presentations')
export class Presentation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;


  @Column()
  pdfKey: string;

  @Column({ nullable: true })
  thumbKey: string;

  @Column({ nullable: true })
  thumbUrl: string;

  @Column()
  url: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { nullable: true })
  noteId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
