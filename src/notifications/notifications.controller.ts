import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('알림')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: '내 알림 목록 조회' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async getMyNotifications(@GetUser() user: User): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.findByUserId(user.id);
    return notifications.map((n) => new NotificationResponseDto(n));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markNotificationAsRead(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    return new NotificationResponseDto(notification);
  }
}
