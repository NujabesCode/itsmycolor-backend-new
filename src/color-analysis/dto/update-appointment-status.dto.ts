import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../entities/consulting-appointment.entity';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    description: '예약 상태',
    enum: AppointmentStatus,
    example: '상담 완료',
  })
  @IsNotEmpty({ message: '예약 상태는 필수 항목입니다.' })
  @IsEnum(AppointmentStatus, { message: '유효하지 않은 예약 상태입니다.' })
  status: AppointmentStatus;
} 