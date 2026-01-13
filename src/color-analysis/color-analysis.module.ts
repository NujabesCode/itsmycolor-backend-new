import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorAnalysis } from './entities/color-analysis.entity';
import { ColorAnalysisService } from './color-analysis.service';
import { ColorAnalysisController } from './color-analysis.controller';
import { ConsultingAppointment } from './entities/consulting-appointment.entity';
import { ConsultingAppointmentController } from './consulting-appointment.controller';
import { ConsultingAppointmentService } from './consulting-appointment.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ColorAnalysis, ConsultingAppointment]),
    UsersModule
  ],
  controllers: [ColorAnalysisController, ConsultingAppointmentController],
  providers: [ColorAnalysisService, ConsultingAppointmentService],
  exports: [ColorAnalysisService, ConsultingAppointmentService],
})
export class ColorAnalysisModule {} 