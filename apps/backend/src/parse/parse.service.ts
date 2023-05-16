import { Inject, Injectable, Logger } from '@nestjs/common';
import { ParseArgsTDI } from '../constants';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class ParseService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}

  async readAndParseFile({
    type,
    fileName,
    program,
    fileContents,
  }: ParseArgsTDI): Promise<unknown> {
    try {
      return parseTDI({ type, fileName, program, fileContents });
    } catch (err) {
      this.appLogger.error(err, 'Error parsing file');
      throw err;
    }
  }
}
