import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  IsUUID, 
  Min 
} from 'class-validator';
import { ColorSeason } from '../../common/types/color-season.enum';
import { BodyType } from '../../common/types/body-type.enum';

export class CreateColorAnalysisDto {
  @ApiProperty({
    description: '키(cm)',
    example: 170,
  })
  @IsNumber({}, { message: '키는 숫자로 입력해주세요.' })
  @Min(1, { message: '키는 1cm 이상이어야 합니다.' })
  @IsNotEmpty({ message: '키를 입력해주세요.' })
  height: number;

  @ApiProperty({
    description: '몸무게(kg)',
    example: 65,
  })
  @IsNumber({}, { message: '몸무게는 숫자로 입력해주세요.' })
  @Min(1, { message: '몸무게는 1kg 이상이어야 합니다.' })
  @IsNotEmpty({ message: '몸무게를 입력해주세요.' })
  weight: number;

  @ApiProperty({
    description: '체형 타입',
    enum: BodyType,
  })
  @IsEnum(BodyType, { message: '올바른 체형 타입을 선택해주세요.' })
  @IsOptional()
  bodyType?: BodyType;

  @ApiProperty({
    description: '퍼스널 컬러',
    enum: ColorSeason,
  })
  @IsEnum(ColorSeason, { message: '올바른 퍼스널 컬러를 선택해주세요.' })
  @IsOptional()
  colorSeason?: ColorSeason;

  @ApiProperty({
    description: '선호 스타일',
    example: '캐주얼',
    required: false,
  })
  @IsString({ message: '선호 스타일은 문자열이어야 합니다.' })
  @IsOptional()
  preferredStyle?: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: '올바른 사용자 ID 형식이 아닙니다.' })
  @IsNotEmpty({ message: '사용자 ID를 입력해주세요.' })
  userId: string;
} 