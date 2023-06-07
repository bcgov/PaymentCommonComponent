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
import { InjectRepository } from '@nestjs/typeorm';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { Repository } from 'typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { format } from 'date-fns';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';

@Injectable()
export class ParseService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService,
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>,
    @InjectRepository(FileIngestionRulesEntity)
    private ingestionRulesRepo: Repository<FileIngestionRulesEntity>,
    @InjectRepository(ProgramDailyUploadEntity)
    private programDailyRepo: Repository<ProgramDailyUploadEntity>
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
      this.appLogger.log(list);
      await validateOrReject(list);
    } catch (e: any) {
      this.appLogger.error('ERROR');
      console.log(e[0]);
      // We can use error.children.value
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

  async getFileUploadedForDate(date: Date): Promise<FileUploadedEntity | null> {
    return null;
    // return this.uploadedRepo.findOne({
    //   where: {
    //     dataDate: date,
    //   },
    // });
    /*await this.uploadedRepo.createQueryBuilder('fileUploaded')
      .andWhere('dataDate = :today', { today: format(date, 'yyyy-MM-dd') })
      .getOne();*/
  }

  async saveFileUploaded(
    fileUploaded: Partial<FileUploadedEntity>
  ): Promise<FileUploadedEntity> {
    return this.uploadedRepo.save(fileUploaded);
  }

  async getAllRules(): Promise<FileIngestionRulesEntity[]> {
    return this.ingestionRulesRepo.find();
  }

  async getRulesForProgram(program: string): Promise<FileIngestionRulesEntity> {
    return this.ingestionRulesRepo.findOneOrFail({
      where: {
        program,
      },
    });
  }

  async getDailyForRule(
    rules: FileIngestionRulesEntity,
    date: Date
  ): Promise<ProgramDailyUploadEntity | null> {
    return this.programDailyRepo.findOne({
      relations: ['rule', 'files'],
      where: {
        dataDate: date,
        rule: {
          id: rules.id,
        },
      },
    });
  }

  async createNewDaily(rules: FileIngestionRulesEntity, date: Date) {
    try {
      const newDaily: Partial<ProgramDailyUploadEntity> = {
        dataDate: date,
        success: false,
        retries: 0,
        rule: rules,
      };
      const daily = this.programDailyRepo.create(newDaily);
      return this.saveDaily(daily);
    } catch (e) {
      console.log(e);
    }
  }

  async saveDaily(
    daily: ProgramDailyUploadEntity
  ): Promise<ProgramDailyUploadEntity> {
    return this.programDailyRepo.save(daily);
  }
}
