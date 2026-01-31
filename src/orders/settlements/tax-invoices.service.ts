import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TaxInvoice, TaxInvoiceStatus } from './entities/tax-invoice.entity';
import { Settlement, SettlementStatus } from './entities/settlement.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Injectable()
export class TaxInvoicesService {
  constructor(
    @InjectRepository(TaxInvoice)
    private taxInvoiceRepository: Repository<TaxInvoice>,
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
  ) {}

  // 세금계산서 목록 조회
  async findAll(): Promise<TaxInvoice[]> {
    // 정산 완료되었지만 세금계산서가 없는 경우 자동 생성
    const completedSettlements = await this.settlementRepository.find({
      where: { status: SettlementStatus.COMPLETED },
      relations: ['brand'],
    });

    for (const settlement of completedSettlements) {
      const existingInvoice = await this.taxInvoiceRepository.findOne({
        where: { settlementId: settlement.id },
      });

      if (!existingInvoice) {
        try {
          await this.createForSettlement(settlement.id);
        } catch (error) {
          console.error(`세금계산서 자동 생성 실패 (정산 ID: ${settlement.id}):`, error);
        }
      }
    }

    return this.taxInvoiceRepository.find({
      relations: ['settlement', 'brand'],
      order: { createdAt: 'DESC' },
    });
  }

  // 정산 완료 시 세금계산서 자동 생성
  async createForSettlement(settlementId: string): Promise<TaxInvoice> {
    const settlement = await this.settlementRepository.findOne({
      where: { id: settlementId },
      relations: ['brand'],
    });

    if (!settlement) {
      throw new NotFoundException('정산을 찾을 수 없습니다.');
    }

    // 이미 세금계산서가 있는지 확인
    const existingInvoice = await this.taxInvoiceRepository.findOne({
      where: { settlementId },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // 세금계산서 번호 생성 (YYYYMMDD-XXXX 형식)
    // 날짜별 순차 번호로 생성하여 중복 방지
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 해당 날짜에 발행된 세금계산서 개수 조회
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const todayInvoices = await this.taxInvoiceRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });
    
    // 오늘 발행된 세금계산서 개수 + 1을 순번으로 사용
    const sequenceNumber = (todayInvoices.length + 1).toString().padStart(4, '0');
    const invoiceNumber = `${dateStr}-${sequenceNumber}`;

    // 공급가액, 부가세, 합계금액 계산
    const supplyAmount = settlement.actualSettlementAmount;
    const vatAmount = Math.round(supplyAmount * 0.1); // 부가세 10%
    const totalAmount = supplyAmount + vatAmount;

    const taxInvoice = this.taxInvoiceRepository.create({
      settlementId: settlement.id,
      brandId: settlement.brandId,
      invoiceNumber,
      status: TaxInvoiceStatus.PENDING,
      supplyAmount,
      vatAmount,
      totalAmount,
    });

    return await this.taxInvoiceRepository.save(taxInvoice);
  }

  // 세금계산서 발행
  async issue(invoiceId: string): Promise<TaxInvoice> {
    const invoice = await this.taxInvoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['settlement', 'brand'],
    });

    if (!invoice) {
      throw new NotFoundException('세금계산서를 찾을 수 없습니다.');
    }

    if (invoice.status === TaxInvoiceStatus.ISSUED) {
      throw new BadRequestException('이미 발행된 세금계산서입니다.');
    }

    invoice.status = TaxInvoiceStatus.ISSUED;
    invoice.issuedAt = new Date();

    return await this.taxInvoiceRepository.save(invoice);
  }

  // 세금계산서 다운로드 (PDF 생성은 추후 구현)
  async getDownloadUrl(invoiceId: string): Promise<string> {
    const invoice = await this.taxInvoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('세금계산서를 찾을 수 없습니다.');
    }

    if (invoice.status !== TaxInvoiceStatus.ISSUED) {
      throw new BadRequestException('발행되지 않은 세금계산서입니다.');
    }

    // TODO: 실제 PDF 생성 로직 구현
    // 현재는 파일 URL이 있으면 반환, 없으면 빈 문자열 반환
    return invoice.fileUrl || '';
  }
}
