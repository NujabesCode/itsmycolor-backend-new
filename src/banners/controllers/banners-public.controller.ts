import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannersService } from '../banners.service';

@ApiTags('배너')
@Controller('banners')
export class BannersPublicController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @ApiOperation({ summary: '메인 페이지 배너(공개, 우선순위 1~5)' })
  async listPublic() {
    return this.service.findPublicForHome();
  }
}


