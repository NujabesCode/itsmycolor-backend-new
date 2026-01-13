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
import { User } from '../../users/entities/user.entity';
import { ColorSeason } from '../../common/types/color-season.enum';
import { BodyType } from '../../common/types/body-type.enum';

@Entity()
export class ColorAnalysis {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '컬러 분석 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '키(cm)' })
  height: number;

  @Column()
  @ApiProperty({ description: '몸무게(kg)' })
  weight: number;

  @Column({ 
    type: 'enum', 
    enum: BodyType,
    nullable: true
  })
  @ApiProperty({ 
    description: '체형 타입', 
    enum: BodyType,
    nullable: true
  })
  bodyType?: BodyType;

  @Column({ 
    type: 'enum', 
    enum: ColorSeason,
    nullable: true
  })
  @ApiProperty({ 
    description: '퍼스널 컬러', 
    enum: ColorSeason,
    nullable: true
  })
  colorSeason?: ColorSeason;

  @Column({ nullable: true })
  @ApiProperty({ description: '선호 스타일', required: false })
  preferredStyle: string;

  @ManyToOne(() => User, (user) => user.colorAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 