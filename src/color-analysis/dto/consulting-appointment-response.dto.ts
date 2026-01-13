import { ApiProperty } from '@nestjs/swagger';
import { ConsultingType, AppointmentStatus } from '../entities/consulting-appointment.entity';

export class ConsultingAppointmentResponseDto {
  @ApiProperty({ description: '예약 ID' })
  id: string;

  @ApiProperty({ description: '예약 번호' })
  appointmentNumber: string;

  @ApiProperty({ description: '고객명' })
  customerName: string;

  @ApiProperty({ description: '연락처' })
  phoneNumber: string;

  @ApiProperty({ description: '컨설팅 유형', enum: ConsultingType })
  consultingType: ConsultingType;

  @ApiProperty({ description: '예약 일시' })
  appointmentDateTime: Date;

  @ApiProperty({ description: '예약 상태', enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiProperty({ description: '특이사항', required: false })
  notes?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<ConsultingAppointmentResponseDto>) {
    Object.assign(this, partial);
  }
} 