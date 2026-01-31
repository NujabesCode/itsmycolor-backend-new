import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
  UseGuards,
  Param,
  Delete,
  Body,
  Res,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ApiDoc } from '../common/decorators/swagger.decorator';

@ApiTags('파일')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파일 업로드' })
  @ApiResponse({ status: 201, description: '파일 업로드 완료' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          default: 'uploads',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB 제한
    },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'uploads',
  ) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    
    try {
      console.log('Uploading file:', file.originalname, 'to folder:', folder);
      const fileUrl = await this.filesService.uploadFile(file, folder);
      return { fileUrl };
    } catch (error) {
      console.error('File upload error:', error);
      throw new InternalServerErrorException(
        `파일 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`,
      );
    }
  }

  @Delete(':url')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파일 삭제 (관리자용)' })
  @ApiResponse({ status: 200, description: '파일 삭제 완료' })
  async deleteFile(@Param('url') fileUrl: string) {
    await this.filesService.deleteFile(fileUrl);
    return { success: true };
  }

  @Get('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '업로드용 Presigned URL 생성' })
  @ApiResponse({ status: 200, description: 'Presigned URL 생성 완료' })
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @Query('folder') folder = 'uploads',
  ) {
    const key = `${folder}/${Date.now()}-${filename}`;
    const url = await this.filesService.generatePresignedUrl(key, contentType);
    
    return {
      url,
      key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }

  @Post('complete-upload')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '파일 업로드 완료 처리',
    description: 'S3 업로드가 완료된 파일의 정보를 DB에 저장합니다.',
    isAuth: true,
    isCreated: true,
  })
  async saveFileInfo(
    @Body('originalName') originalName: string,
    @Body('key') key: string,
    @Body('mimeType') mimeType: string,
    @Body('size') size?: number,
  ) {
    return this.filesService.saveFileInfo(originalName, key, mimeType, size);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '파일 목록 조회',
    description: '저장된 모든 파일 목록을 조회합니다.',
    isAuth: true,
  })
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '파일 상세 조회',
    description: '특정 파일의 상세 정보를 조회합니다.',
    isAuth: true,
  })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }
} 