import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '알림 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @Column()
  @ApiProperty({ description: '알림 제목' })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: '알림 내용' })
  content: string;

  @Column({ default: false })
  @ApiProperty({ description: '읽음 여부', default: false })
  isRead: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
