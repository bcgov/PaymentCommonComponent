import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';
import { SBCGarmsJson } from '../transaction/interface';
import { FileTypes, Ministries, ParseArgsTDI } from '../constants';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionEntity } from '../transaction/entities';
import {
  GarmsTransactionDTO,
  GarmsTransactionList,
} from './dto/garms-transaction.dto';
import { validate, validateOrReject } from 'class-validator';
import { TDI17Details, TDI34Details } from '../flat-files';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';

@Injectable()
export class ParseService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService
  ) {}

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

  async parseGarmsFile(
    contents: string,
    fileName: string
  ): Promise<TransactionEntity[]> {
    const paymentMethods = await this.paymentMethodService.getPaymentMethods();
    const garmsSales = await parseGarms(
      (await JSON.parse(contents || '{}')) as SBCGarmsJson[],
      fileName,
      paymentMethods
    );
    const garmsSalesDTO = garmsSales.map((t) => new GarmsTransactionDTO(t));
    const list = new GarmsTransactionList(garmsSalesDTO);
    try {
      // BUG??
      await validateOrReject(list);
    } catch (e: any) {
      this.appLogger.error('ERROR');
      console.log(e[0]);
      throw new Error('errrorr');
    }
    return garmsSales;
  }

  async parseTDICashFile(
    type: FileTypes,
    fileName: string,
    program: string,
    fileContents: Buffer
  ): Promise<CashDepositEntity[]> {
    const parsed = parseTDI({
      type,
      fileName,
      program,
      fileContents: Buffer.from(fileContents.toString() || '').toString(),
    });

    // validate
    const tdi17Details = parsed as TDI17Details[];
    const cashDeposits = tdi17Details.map(
      (details) => new CashDepositEntity(details)
    );
    return cashDeposits;
  }

  async parseTDICardsFile(
    type: FileTypes,
    fileName: string,
    program: string,
    fileContents: Buffer
  ): Promise<POSDepositEntity[]> {
    const parsed = parseTDI({
      type,
      fileName,
      program,
      fileContents: Buffer.from(fileContents.toString() || '').toString(),
    });

    // validate
    const tdi34Details = parsed as TDI34Details[];
    const posEntities = tdi34Details.map(
      (details) => new POSDepositEntity(details)
    );
    return posEntities;
  }
}
