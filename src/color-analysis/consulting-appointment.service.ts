import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { ConsultingAppointment, AppointmentStatus, ConsultingType } from './entities/consulting-appointment.entity';
import { CreateConsultingAppointmentDto } from './dto/create-consulting-appointment.dto';
import { UpdateConsultingAppointmentDto } from './dto/update-consulting-appointment.dto';
import { ConsultingAppointmentResponseDto } from './dto/consulting-appointment-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConsultingAppointmentService {
  constructor(
    @InjectRepository(ConsultingAppointment)
    private appointmentRepository: Repository<ConsultingAppointment>,
  ) {}

  async create(
    createAppointmentDto: CreateConsultingAppointmentDto,
    userId?: string,
  ): Promise<ConsultingAppointmentResponseDto> {
    // 예약 번호 생성 (C + 년월일 + 순번)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const appointmentNumber = `C${dateStr}${Math.floor(1000 + Math.random() * 9000)}`;

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      appointmentNumber,
      userId,
      status: createAppointmentDto.status || AppointmentStatus.PENDING,
      appointmentDateTime: new Date(createAppointmentDto.appointmentDateTime),
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return new ConsultingAppointmentResponseDto(savedAppointment);
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      consultingType?: ConsultingType;
      status?: AppointmentStatus;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    } = {},
  ): Promise<{ appointments: ConsultingAppointmentResponseDto[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      consultingType,
      status,
      startDate,
      endDate,
      search,
    } = options;

    const skip = (page - 1) * limit;
    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment');

    // 필터링 조건 적용
    if (consultingType) {
      queryBuilder.andWhere('appointment.consultingType = :consultingType', { consultingType });
    }

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'appointment.appointmentDateTime BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    } else if (startDate) {
      queryBuilder.andWhere('appointment.appointmentDateTime >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('appointment.appointmentDateTime <= :endDate', { endDate });
    }

    if (search) {
      queryBuilder.andWhere(
        '(appointment.customerName LIKE :search OR appointment.phoneNumber LIKE :search OR appointment.appointmentNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 정렬: 최근 예약 일시 순
    queryBuilder.orderBy('appointment.appointmentDateTime', 'DESC');

    const [appointments, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      appointments: appointments.map(appointment => new ConsultingAppointmentResponseDto(appointment)),
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<ConsultingAppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`예약 ID ${id}를 찾을 수 없습니다.`);
    }
    return new ConsultingAppointmentResponseDto(appointment);
  }

  async findByUserId(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ appointments: ConsultingAppointmentResponseDto[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [appointments, total] = await this.appointmentRepository.findAndCount({
      where: { userId },
      order: { appointmentDateTime: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      appointments: appointments.map(appointment => new ConsultingAppointmentResponseDto(appointment)),
      total,
      page,
      totalPages,
    };
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateConsultingAppointmentDto,
  ): Promise<ConsultingAppointmentResponseDto> {
    await this.findOne(id);

    // DTO에서 날짜 필드 제거하고 나머지 필드만 업데이트
    const { appointmentDateTime, ...updateFields } = updateAppointmentDto;
    
    await this.appointmentRepository.update(id, updateFields);
    
    // 날짜 필드가 존재하는 경우 별도로 업데이트
    if (appointmentDateTime) {
      await this.appointmentRepository.update(id, {
        appointmentDateTime: new Date(appointmentDateTime)
      });
    }
    
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<ConsultingAppointmentResponseDto> {
    await this.findOne(id);
    await this.appointmentRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.appointmentRepository.delete(id);
  }

  async getAppointmentsByDate(date: Date): Promise<ConsultingAppointmentResponseDto[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDateTime: Between(startOfDay, endOfDay),
      },
      order: {
        appointmentDateTime: 'ASC',
      },
    });
    
    return appointments.map(appointment => new ConsultingAppointmentResponseDto(appointment));
  }
} 