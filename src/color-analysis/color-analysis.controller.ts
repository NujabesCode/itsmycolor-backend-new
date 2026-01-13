import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ColorAnalysisService } from './color-analysis.service';
import { CreateColorAnalysisDto } from './dto/create-color-analysis.dto';
import { UpdateColorAnalysisDto } from './dto/update-color-analysis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../common/decorators/swagger.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('컬러 분석')
@Controller('color-analysis')
export class ColorAnalysisController {
  constructor(private readonly colorAnalysisService: ColorAnalysisService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '컬러 분석 결과 생성',
    description: '새로운 컬러 분석 결과를 저장합니다.',
    isAuth: true,
    isCreated: true,
  })
  create(@Body() createColorAnalysisDto: CreateColorAnalysisDto, @GetUser() user: User) {
    createColorAnalysisDto.userId = user.id;
    return this.colorAnalysisService.create(createColorAnalysisDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '컬러 분석 결과 목록 조회',
    description: '모든 컬러 분석 결과를 페이지네이션하여 조회합니다.',
    isAuth: true,
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.colorAnalysisService.findAll(paginationDto);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '내 컬러 분석 결과 조회',
    description: '현재 로그인한 사용자의 컬러 분석 결과를 조회합니다.',
    isAuth: true,
  })
  findMine(@GetUser() user: User) {
    return this.colorAnalysisService.findByUserId(user.id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '특정 사용자의 컬러 분석 결과 조회',
    description: '특정 사용자의 컬러 분석 결과를 조회합니다.',
    isAuth: true,
  })
  findByUser(@Param('userId') userId: string) {
    return this.colorAnalysisService.findByUserId(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '컬러 분석 결과 상세 조회',
    description: '특정 컬러 분석 결과의 상세 정보를 조회합니다.',
    isAuth: true,
  })
  findOne(@Param('id') id: string) {
    return this.colorAnalysisService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '컬러 분석 결과 수정',
    description: '특정 컬러 분석 결과를 수정합니다.',
    isAuth: true,
  })
  update(
    @Param('id') id: string,
    @Body() updateColorAnalysisDto: UpdateColorAnalysisDto,
  ) {
    return this.colorAnalysisService.update(id, updateColorAnalysisDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '컬러 분석 결과 삭제',
    description: '특정 컬러 분석 결과를 삭제합니다.',
    isAuth: true,
  })
  remove(@Param('id') id: string) {
    return this.colorAnalysisService.remove(id);
  }
} 