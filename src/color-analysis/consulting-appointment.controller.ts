import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ConsultingAppointmentService } from './consulting-appointment.service';
import { CreateConsultingAppointmentDto } from './dto/create-consulting-appointment.dto';
import { UpdateConsultingAppointmentDto } from './dto/update-consulting-appointment.dto';
import { ConsultingAppointmentResponseDto } from './dto/consulting-appointment-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { AppointmentStatus, ConsultingType } from './entities/consulting-appointment.entity';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@ApiTags('컨설팅 예약')
@Controller('consulting-appointments')
export class ConsultingAppointmentController {
  constructor(private readonly appointmentService: ConsultingAppointmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 생성' })
  @ApiResponse({ status: 201, description: '예약 생성 완료', type: ConsultingAppointmentResponseDto })
  async create(
    @Body() createAppointmentDto: CreateConsultingAppointmentDto,
    @GetUser() user: User,
  ) {
    return this.appointmentService.create(createAppointmentDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '예약 목록 반환', type: [ConsultingAppointmentResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 예약 수' })
  @ApiQuery({ name: 'consultingType', required: false, description: '컨설팅 유형', enum: ConsultingType })
  @ApiQuery({ name: 'status', required: false, description: '예약 상태', enum: AppointmentStatus })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (이름, 연락처, 예약번호)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('consultingType') consultingType?: ConsultingType,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.appointmentService.findAll({
      page,
      limit,
      consultingType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 컨설팅 예약 목록 조회' })
  @ApiResponse({ status: 200, description: '내 예약 목록 반환', type: [ConsultingAppointmentResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 예약 수' })
  async findMyAppointments(
    @GetUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.appointmentService.findByUserId(user.id, { page, limit });
  }

  @Get('date/:date')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 날짜의 컨설팅 예약 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '해당 날짜의 예약 목록 반환', type: [ConsultingAppointmentResponseDto] })
  @ApiParam({ name: 'date', description: '날짜 (YYYY-MM-DD)' })
  async getAppointmentsByDate(@Param('date') dateString: string) {
    return this.appointmentService.getAppointmentsByDate(new Date(dateString));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 상세 조회' })
  @ApiResponse({ status: 200, description: '예약 상세 정보 반환', type: ConsultingAppointmentResponseDto })
  @ApiParam({ name: 'id', description: '예약 ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 수정 (관리자용)' })
  @ApiResponse({ status: 200, description: '예약 수정 완료', type: ConsultingAppointmentResponseDto })
  @ApiParam({ name: 'id', description: '예약 ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateConsultingAppointmentDto,
  ) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 상태 변경 (관리자용)' })
  @ApiResponse({ status: 200, description: '예약 상태 변경 완료', type: ConsultingAppointmentResponseDto })
  @ApiParam({ name: 'id', description: '예약 ID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, statusDto.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '컨설팅 예약 삭제 (관리자용)' })
  @ApiResponse({ status: 200, description: '예약 삭제 완료' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id);
  }
} 