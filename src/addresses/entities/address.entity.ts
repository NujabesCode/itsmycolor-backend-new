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

@Entity()
export class Address {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '주소 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '이름' })
  name: string;

  @Column()
  @ApiProperty({ description: '전화번호' })
  phone: string;

  @Column()
  @ApiProperty({ description: '우편번호' })
  postalCode: string;

  @Column()
  @ApiProperty({ description: '주소' })
  address: string;

  @Column()
  @ApiProperty({ description: '상세 주소' })
  detailAddress: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '배송 요청 사항', required: false })
  deliveryRequest?: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 