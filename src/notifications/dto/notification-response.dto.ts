import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ description: '알림 ID' })
  id: string;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '알림 제목' })
  title: string;

  @ApiProperty({ description: '알림 내용' })
  content: string;

  @ApiProperty({ description: '읽음 여부' })
  isRead: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.userId = notification.userId;
    this.title = notification.title;
    this.content = notification.content;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
  }
}
