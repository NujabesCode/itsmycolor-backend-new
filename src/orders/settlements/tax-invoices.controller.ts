import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TaxInvoicesService } from './tax-invoices.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Response } from 'express';

@ApiTags('세금계산서')
@Controller('tax-invoices')
export class TaxInvoicesController {
  constructor(private readonly taxInvoicesService: TaxInvoicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '세금계산서 목록 조회' })
  @ApiResponse({ status: 200, description: '세금계산서 목록 반환' })
  async findAll() {
    return this.taxInvoicesService.findAll();
  }

  @Post('issue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '세금계산서 발행' })
  @ApiResponse({ status: 201, description: '세금계산서 발행 완료' })
  async issue(@Body() body: { settlementId: string }) {
    // settlementId로 세금계산서 찾기
    const invoices = await this.taxInvoicesService.findAll();
    const invoice = invoices.find(inv => inv.settlementId === body.settlementId);
    
    if (!invoice) {
      // 세금계산서가 없으면 먼저 생성
      const newInvoice = await this.taxInvoicesService.createForSettlement(body.settlementId);
      return this.taxInvoicesService.issue(newInvoice.id);
    }
    
    return this.taxInvoicesService.issue(invoice.id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '세금계산서 다운로드' })
  @ApiResponse({ status: 200, description: '세금계산서 파일 다운로드' })
  @ApiParam({ name: 'id', description: '세금계산서 ID' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const fileUrl = await this.taxInvoicesService.getDownloadUrl(id);
    
    if (!fileUrl) {
      return res.status(404).json({ message: '세금계산서 파일을 찾을 수 없습니다.' });
    }

    // TODO: 실제 파일 다운로드 로직 구현
    return res.json({ fileUrl });
  }
}
