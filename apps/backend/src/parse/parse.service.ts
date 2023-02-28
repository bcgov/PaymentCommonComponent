import { Inject, Injectable, Logger } from '@nestjs/common';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class ParseService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}

  async readAndParseFile(
    type: string,
    program: string,
    fileName: string,
    data: Buffer
  ): Promise<unknown> {
    try {
      return parseTDI(type, program, fileName, data.toString());
    } catch (err) {
      this.appLogger.error(err, 'Error parsing file');
      throw err;
    }
  }
}
