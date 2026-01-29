import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CustomerFilterDto, CustomerResponseDto, AdminDashboardResponseDto } from './dto/admin-customer.dto';
import { User } from '../users/entities/user.entity';
import {
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserFilterDto,
  UserResponseDto,
  UpdateUserPasswordByEmailDto,
} from './dto/admin-settings.dto';

@ApiTags('관리자')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('customers')
  @ApiOperation({ summary: '고객 목록 조회' })
  @ApiResponse({ status: 200, description: '고객 목록 반환', type: [CustomerResponseDto] })
  @ApiQuery({ name: 'customerType', required: false, description: '고객 타입 필터링' })
  @ApiQuery({ name: 'bodyType', required: false, description: '체형 타입 필터링' })
  @ApiQuery({ name: 'colorSeason', required: false, description: '퍼스널 컬러 필터링' })
  @ApiQuery({ name: 'searchTerm', required: false, description: '검색어 (이름, 이메일, 전화번호)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  async getCustomers(@Query() filters: CustomerFilterDto) {
    try {
      return await this.adminService.getCustomers(filters);
    } catch (error) {
      this.logger.error(`고객 목록 조회 중 오류 발생: ${error.message}`, error.stack);
      throw new HttpException('고객 목록을 조회하는 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: '대시보드 데이터 조회' })
  @ApiResponse({ status: 200, description: '대시보드 데이터 반환', type: AdminDashboardResponseDto })
  async getDashboardData() {
    try {
      return await this.adminService.getDashboardData();
    } catch (error) {
      this.logger.error(`대시보드 데이터 조회 중 오류 발생: ${error.message}`, error.stack);
      // 빈 대시보드 데이터 반환하여 프론트엔드가 중단되지 않도록 처리
      return {
        customerStatistics: {
          totalCustomers: 0,
          consultingCustomers: 0,
          purchaseCustomers: 0,
          vipCustomers: 0
        },
        totalOrders: 0,
        monthlySales: [],
        bodyTypeAnalysis: [],
        topProducts: [],
        ageGroupSales: [],
        consultingConversion: {
          overall: 0,
          colorAnalysis: 0,
          bodyTypeAnalysis: 0,
          styleAnalysis: 0
        },
        brandPerformance: [],
        bodyTypeSales: []
      };
    }
  }

  @Get('users')
  @ApiOperation({ summary: '사용자 목록 조회 (관리자 설정)' })
  @ApiResponse({ status: 200, description: '사용자 목록 반환', type: [UserResponseDto] })
  @ApiQuery({ name: 'role', required: false, description: '사용자 권한 필터링' })
  @ApiQuery({ name: 'searchTerm', required: false, description: '검색어 (이름, 이메일)' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성화 여부 필터링' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  async getUsers(@Query() filters: UserFilterDto) {
    try {
      return await this.adminService.getUsers(filters);
    } catch (error) {
      this.logger.error(`사용자 목록 조회 중 오류 발생: ${error.message}`, error.stack);
      throw new HttpException('사용자 목록을 조회하는 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users/:id')
  @ApiOperation({ summary: '사용자 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환', type: UserResponseDto })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.adminService.getUserById(id);
    } catch (error) {
      this.logger.error(`사용자 정보 조회 중 오류 발생 [ID: ${id}]: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '사용자 정보를 조회하는 중 오류가 발생했습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: '사용자 권한 변경' })
  @ApiResponse({ status: 200, description: '사용자 정보 업데이트 완료', type: UserResponseDto })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateUserRoleDto
  ) {
    try {
      return await this.adminService.updateUserRole(id, updateRoleDto.role);
    } catch (error) {
      this.logger.error(`사용자 권한 변경 중 오류 발생 [ID: ${id}]: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '사용자 권한을 변경하는 중 오류가 발생했습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: '사용자 활성화 상태 변경' })
  @ApiResponse({ status: 200, description: '사용자 활성화 상태 업데이트 완료', type: UserResponseDto })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  async toggleUserActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateUserStatusDto
  ) {
    try {
      return await this.adminService.toggleUserActive(id, updateStatusDto.isActive);
    } catch (error) {
      this.logger.error(`사용자 활성화 상태 변경 중 오류 발생 [ID: ${id}]: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '사용자 활성화 상태를 변경하는 중 오류가 발생했습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('users/password')
  @ApiOperation({ summary: '사용자 비밀번호 변경 (이메일 기준)' })
  @ApiResponse({
    status: 200,
    description: '사용자 비밀번호 변경 완료',
    type: UserResponseDto,
  })
  async updateUserPasswordByEmail(
    @Body() updatePasswordDto: UpdateUserPasswordByEmailDto,
  ) {
    try {
      return await this.adminService.updateUserPasswordByEmail(updatePasswordDto);
    } catch (error) {
      this.logger.error(
        `사용자 비밀번호 변경 중 오류 발생 [Email: ${updatePasswordDto.email}]: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || '사용자 비밀번호를 변경하는 중 오류가 발생했습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 