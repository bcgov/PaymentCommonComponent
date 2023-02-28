import { Inject, Injectable, Logger } from '@nestjs/common';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class ParseService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}
  //TODO this is temporary for testing the parsed garms json only
  async readAndParseGarms(filename: string, filebuffer: Buffer) {
    try {
      return parseGarms(JSON.parse(filebuffer.toString()), '', []);
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

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
