import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 비밀번호 확인 체크
    if (createUserDto.password !== createUserDto.passwordConfirm) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    }

    // 이메일 정규화 (소문자 변환 및 공백 제거)
    const normalizedEmail = createUserDto.email?.trim().toLowerCase();

    // 이메일 중복 체크 (대소문자 무시)
    const existingUser = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
      .getOne();

    if (existingUser) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    // 비밀번호 확인 필드는 저장하지 않음
    const { passwordConfirm, ...userData } = createUserDto;
    // 이메일 정규화 적용
    userData.email = normalizedEmail;
    const user = this.usersRepository.create(userData);

    return this.usersRepository.save(user);
  }

  async findOrCreate(email: string): Promise<User> {
    // 이메일 정규화
    const normalizedEmail = email?.trim().toLowerCase();
    let user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    
    // 정확한 매칭 실패 시 대소문자 무시 검색
    if (!user) {
      user = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
        .getOne();
    }
    if (user) {
      return user;
    }

    const newUser = this.usersRepository.create({ email });
    return this.usersRepository.save(newUser);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['productLikes', 'brandLikes'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    // 이메일 정규화
    const normalizedEmail = email?.trim().toLowerCase();
    let user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    
    // 정확한 매칭 실패 시 대소문자 무시 검색
    if (!user) {
      user = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
        .getOne();
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 이메일 변경 시 중복 체크
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('이미 사용 중인 이메일입니다.');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // 외래키 제약조건을 우회하여 삭제하기 위해 트랜잭션 사용
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 외래키 검사 비활성화
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');

      // 사용자 삭제
      await queryRunner.manager.remove(user);

      // 외래키 검사 다시 활성화
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateRole(id: string, role: UserRole) {
    await this.usersRepository.update(id, { role });
  }

  async updatePasswordByEmail(email: string, newPassword: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.password = newPassword;
    return this.usersRepository.save(user);
  }

  // UI-037: 비밀번호 변경 (현재 비밀번호 검증 포함)
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.password) {
      throw new BadRequestException('비밀번호가 설정되지 않은 계정입니다.');
    }

    // 현재 비밀번호 검증
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
    }

    // 새 비밀번호 설정 (hashPassword가 자동으로 해시화)
    user.password = newPassword;
    return this.usersRepository.save(user);
  }

  // ADM-009: 다중 로그인 방지를 위한 마지막 토큰 ID 업데이트
  async updateLastTokenId(userId: string, tokenId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastTokenId: tokenId });
  }
}
