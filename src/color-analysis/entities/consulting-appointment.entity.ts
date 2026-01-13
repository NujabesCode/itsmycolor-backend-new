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

export enum AppointmentStatus {
  PENDING = '예약 확정',
  COMPLETED = '상담 완료',
  CANCELLED = '예약 취소',
  NOSHOW = '미출석',
}

export enum ConsultingType {
  PERSONAL_COLOR = '퍼스널 컬러',
  BODY_ANALYSIS = '체형 분석',
  COLOR_THERAPY = '컬러 테라피',
}

@Entity()
export class ConsultingAppointment {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '예약 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '예약 번호' })
  appointmentNumber: string;

  @Column()
  @ApiProperty({ description: '고객명' })
  customerName: string;

  @Column()
  @ApiProperty({ description: '연락처' })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: ConsultingType,
    default: ConsultingType.PERSONAL_COLOR
  })
  @ApiProperty({
    description: '컨설팅 유형',
    enum: ConsultingType,
    default: ConsultingType.PERSONAL_COLOR
  })
  consultingType: ConsultingType;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: '예약 일시' })
  appointmentDateTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING
  })
  @ApiProperty({
    description: '예약 상태',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '특이사항', required: false })
  notes: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 