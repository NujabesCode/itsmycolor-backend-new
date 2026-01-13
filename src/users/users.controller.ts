import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../common/decorators/swagger.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('사용자')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('check-email/:email')
  @ApiDoc({
    summary: '이메일 중복 체크',
    description: '이메일이 이미 사용 중인지 확인합니다.',
  })
  async checkEmail(@Param('email') email: string) {
    const existingUser = await this.usersService.findByEmail(email);
    return {
      isAvailable: !existingUser,
      message: existingUser ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '내 정보 조회',
    description: '현재 인증된 사용자의 정보를 조회합니다.',
    isAuth: true,
  })
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '내 정보 수정',
    description: '현재 인증된 사용자의 정보를 수정합니다.',
    isAuth: true,
  })
  update(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('profile/password')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 검증하고 새 비밀번호로 변경합니다.',
    isAuth: true,
  })
  changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDoc({
    summary: '사용자 삭제',
    description: '특정 사용자를 삭제합니다.',
    isAuth: true,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
