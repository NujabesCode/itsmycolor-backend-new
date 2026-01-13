import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findOneByUserId(userId: string): Promise<Address | null> {
    return this.addressRepository.findOne({ where: { userId } });
  }

  async updateOrCreate(createAddressDto: CreateAddressDto, userId: string): Promise<Address> {
    const address = await this.findOneByUserId(userId);
    if (address) {
      return this.update(address.id, createAddressDto, userId);
    }
    return this.create(createAddressDto, userId);
  }

  async create(createAddressDto: CreateAddressDto, userId: string): Promise<Address> {
    const address = this.addressRepository.create({ ...createAddressDto, userId });
    return this.addressRepository.save(address);
  }

  async findAll(userId: string): Promise<Address[]> {
    return this.addressRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id, userId } });

    if (!address) {
      throw new NotFoundException('주소를 찾을 수 없습니다.');
    }

    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto, userId: string): Promise<Address> {
    const address = await this.findOne(id, userId);

    Object.assign(address, updateAddressDto);

    return this.addressRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepository.remove(address);
  }
} 