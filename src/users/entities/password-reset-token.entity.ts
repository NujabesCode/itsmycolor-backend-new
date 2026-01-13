import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '토큰 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '토큰' })
  token: string;

  @Column()
  @ApiProperty({ description: '만료 시간' })
  expiresAt: Date;

  @Column({ default: false })
  @ApiProperty({ description: '사용 여부' })
  isUsed: boolean;

  @Column()
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 