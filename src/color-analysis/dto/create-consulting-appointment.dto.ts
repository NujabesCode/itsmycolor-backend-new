import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ConsultingType, AppointmentStatus } from '../entities/consulting-appointment.entity';

export class CreateConsultingAppointmentDto {
  @ApiProperty({ description: '고객명' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: '연락처' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: '컨설팅 유형', enum: ConsultingType })
  @IsEnum(ConsultingType)
  consultingType: ConsultingType;

  @ApiProperty({ description: '예약 일시 (YYYY-MM-DD HH:MM:SS)' })
  @IsDateString()
  appointmentDateTime: string;

  @ApiProperty({ description: '예약 상태', enum: AppointmentStatus, required: false })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({ description: '특이사항', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
} 