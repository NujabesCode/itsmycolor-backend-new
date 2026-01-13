import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qna } from './entities/qna.entity';
import { QnaService } from './qna.service';
import { QnaController } from './qna.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Qna]),
    FilesModule
  ],
  controllers: [QnaController],
  providers: [QnaService],
  exports: [QnaService],
})
export class QnaModule {} 