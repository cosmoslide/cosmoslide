import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum KeyAlgorithm {
  RSA = 'RSASSA-PKCS1-v1_5',
  Ed25519 = 'Ed25519',
}

@Entity('keypairs')
@Index(['userId', 'algorithm'])
export class KeyPair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: KeyAlgorithm,
    default: KeyAlgorithm.RSA,
  })
  algorithm: KeyAlgorithm;

  @Column('text')
  publicKey: string; // PEM format

  @Column('text')
  privateKey: string; // PEM format

  @ManyToOne(() => User, (user) => user.keyPairs, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
