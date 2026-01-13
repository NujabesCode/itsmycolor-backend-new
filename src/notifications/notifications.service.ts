import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async createFirstOrderNotification(userId: string, title: string) {
    const couponId = 'ITSMYCOLORSHOP';
    const content = `쿠폰 번호는 ${couponId} 입니다. 네이버 예약시 입력해주세요.`;
    const notification = this.notificationRepository.create({ userId, title, content });
    await this.notificationRepository.save(notification);
  }

  // SM-013, SM-014, SM-015: 알림 생성 메서드
  async create(data: { userId: string; title: string; content: string }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return await this.notificationRepository.save(notification);
  }
}
