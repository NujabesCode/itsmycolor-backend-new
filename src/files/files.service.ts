import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { File, FileType } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private readonly configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('AWS_REGION') || 'ap-northeast-2';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'default-bucket';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async create(createFileDto: CreateFileDto): Promise<File> {
    const file = this.filesRepository.create(createFileDto);
    return this.filesRepository.save(file);
  }

  async findAll(): Promise<File[]> {
    return this.filesRepository.find();
  }

  async findOne(id: string): Promise<File> {
    const file = await this.filesRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    return file;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // fileUrl이 없는 경우 처리
    if (!fileUrl || fileUrl.trim() === '') {
      return;
    }

    try {
      // S3 URL에서 Key 추출
      const urlParts = fileUrl.split('/');
      if (urlParts.length < 4) {
        console.warn(`Invalid S3 URL format: ${fileUrl}`);
        return;
      }
      
      const key = urlParts.slice(3).join('/');
      if (!key || key.trim() === '') {
        console.warn(`Empty key extracted from URL: ${fileUrl}`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Error deleting file from S3: ${error.message}`);
      // 파일 삭제 실패 시에도 애플리케이션은 계속 진행
    }
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async saveFileInfo(originalName: string, key: string, mimeType: string, size?: number): Promise<File> {
    // 파일 URL 생성
    const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    
    // 파일 유형 판단
    let fileType = FileType.OTHER;
    if (mimeType.startsWith('image/')) {
      fileType = FileType.IMAGE;
    } else if (mimeType.includes('document') || mimeType.includes('pdf')) {
      fileType = FileType.DOCUMENT;
    }
    
    // 파일 정보 저장
    const fileData: CreateFileDto = {
      originalName,
      filename: key.split('/').pop() || key,
      path: key,
      url,
      type: fileType,
      mimeType,
      size,
    };
    
    return this.create(fileData);
  }

  async delete(id: string): Promise<void> {
    const file = await this.findOne(id);
    
    // S3에서 파일 삭제
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: file.path,
    });
    
    await this.s3Client.send(deleteCommand);
    
    // 데이터베이스에서 파일 정보 삭제
    await this.filesRepository.remove(file);
  }
} 