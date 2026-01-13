import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '인증 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '이메일' })
  email: string;

  @Column()
  @ApiProperty({ description: '인증 코드' })
  verificationCode: string;

  @Column()
  @ApiProperty({ description: '만료 시간' })
  expiresAt: Date;

  @Column({ default: false })
  @ApiProperty({ description: '인증 여부' })
  isVerified: boolean;

  @Column({ default: 0 })
  @ApiProperty({ description: '시도 횟수' })
  attemptCount: number;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 