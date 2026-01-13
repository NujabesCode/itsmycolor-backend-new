import * as multer from 'multer';

// Express.Multer가 없어서 발생하는 오류를 해결하기 위한 타입 확장
declare global {
  namespace Express {
    namespace Multer {
      interface File extends multer.File {
        originalname: string;
        buffer: Buffer;
        mimetype: string;
      }
    }
  }
} 