import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerQnaDto {
  @ApiProperty({ description: '답변 내용' })
  @IsString()
  @IsNotEmpty()
  answer: string;
} 