import { PartialType } from '@nestjs/swagger';
import { CreateConsultingAppointmentDto } from './create-consulting-appointment.dto';

export class UpdateConsultingAppointmentDto extends PartialType(CreateConsultingAppointmentDto) {} 