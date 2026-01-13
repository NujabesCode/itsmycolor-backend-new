import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { FilesService } from '../files/files.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private filesService: FilesService,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<Review> {
    let imageUrls: string[] = [];
    
    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file) => this.filesService.uploadFile(file, 'reviews')),
      );
    }

    const order = await this.orderRepository.findOne({
      where: { id: createReviewDto.orderId },
      relations: ['user', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.user.id !== userId) {
      throw new ForbiddenException('자신의 주문에 대한 리뷰만 작성할 수 있습니다.');
    }

    const orderItem = order.orderItems.find(
      (item) => item.id === createReviewDto.orderItemId,
    );
    
    if (!orderItem) {
      throw new NotFoundException('주문 상품을 찾을 수 없습니다.');
    }

    const review = new Review();
    review.content = createReviewDto.content;
    review.rating = createReviewDto.rating;
    review.imageUrls = imageUrls;
    review.userId = userId;
    review.productId = createReviewDto.productId;
    review.orderId = createReviewDto.orderId;
    review.orderItemId = createReviewDto.orderItemId;
    
    if (createReviewDto.sizeReview) {
      review.sizeReview = createReviewDto.sizeReview;
    }
    
    if (createReviewDto.colorReview) {
      review.colorReview = createReviewDto.colorReview;
    }
    
    if (createReviewDto.thicknessReview) {
      review.thicknessReview = createReviewDto.thicknessReview;
    }
    
    if (createReviewDto.isSecret !== undefined) {
      review.isSecret = createReviewDto.isSecret;
    }

    await this.orderItemRepository.update(orderItem.id, { isReviewed: true });

    return this.reviewRepository.save(review);
  }

  async findAll(
    productId?: string,
    page = 1,
    limit = 10,
  ): Promise<{ reviews: Review[]; total: number; page: number; lastPage: number }> {
    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product');

    if (productId) {
      queryBuilder.where('review.productId = :productId', { productId });
    }

    const total = await queryBuilder.getCount();
    const lastPage = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    
    const reviews = await queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      reviews,
      total,
      page,
      lastPage,
    };
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('자신의 리뷰만 수정할 수 있습니다.');
    }

    if (files && files.length > 0) {
      const newImageUrls = await Promise.all(
        files.map((file) => this.filesService.uploadFile(file, 'reviews')),
      );
      review.imageUrls = [...(review.imageUrls || []), ...newImageUrls];
    }

    if (updateReviewDto.content) {
      review.content = updateReviewDto.content;
    }
    
    if (updateReviewDto.rating) {
      review.rating = updateReviewDto.rating;
    }
    
    if (updateReviewDto.sizeReview) {
      review.sizeReview = updateReviewDto.sizeReview;
    }
    
    if (updateReviewDto.colorReview) {
      review.colorReview = updateReviewDto.colorReview;
    }
    
    if (updateReviewDto.thicknessReview) {
      review.thicknessReview = updateReviewDto.thicknessReview;
    }
    
    if (updateReviewDto.isSecret !== undefined) {
      review.isSecret = updateReviewDto.isSecret;
    }

    return this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('자신의 리뷰만 삭제할 수 있습니다.');
    }

    await this.reviewRepository.remove(review);
  }

  async addHelpful(id: string, userId: string): Promise<Review> {
    const review = await this.findOne(id);
    
    if (review.userId === userId) {
      throw new BadRequestException('자신의 리뷰에는 도움이 돼요를 추가할 수 없습니다.');
    }

    // 실제로는 도움이 돼요 중복 체크 로직이 필요하지만 여기서는 생략

    review.helpfulCount += 1;
    return this.reviewRepository.save(review);
  }
} 