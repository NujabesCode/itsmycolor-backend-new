import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddressResponseDto } from './dto/address-response.dto';

@ApiTags('주소')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get('me')
  @ApiOperation({ summary: '내 주소 조회' })
  @ApiResponse({ status: 200 })
  async getMyAddress(@GetUser() user: User) {
    return await this.addressesService.findOneByUserId(user.id);
  }

  @Post('me')
  @ApiOperation({ summary: '내 주소 생성' })
  @ApiResponse({ status: 201 })
  async createAddress(@GetUser() user: User, @Body() createAddressDto: CreateAddressDto) {
    return await this.addressesService.updateOrCreate(createAddressDto, user.id);
  }
} 