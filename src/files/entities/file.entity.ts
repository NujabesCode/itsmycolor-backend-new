import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '파일 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '원본 파일명' })
  originalName: string;

  @Column()
  @ApiProperty({ description: '저장 파일명' })
  filename: string;

  @Column()
  @ApiProperty({ description: '파일 경로' })
  path: string;

  @Column()
  @ApiProperty({ description: '파일 URL' })
  url: string;

  @Column({ type: 'enum', enum: FileType, default: FileType.OTHER })
  @ApiProperty({ 
    description: '파일 유형', 
    enum: FileType,
    default: FileType.OTHER
  })
  type: FileType;

  @Column({ nullable: true })
  @ApiProperty({ description: '파일 크기', required: false })
  size: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'MIME 타입', required: false })
  mimeType: string;

  @Column({ default: true })
  @ApiProperty({ description: '활성화 여부' })
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 