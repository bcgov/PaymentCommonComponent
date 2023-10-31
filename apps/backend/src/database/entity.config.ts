import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import {
  MinistryLocationEntity,
  BankLocationEntity,
  LocationEntity,
  MerchantEntity,
} from '../location/entities';
import { AlertDestinationEntity } from '../notification/entities/alert-destination.entity';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from '../notification/entities/program-daily-upload.entity';
import { FileUploadedEntity } from '../parse/entities/file-uploaded.entity';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';
import {
  PaymentMethodEntity,
  PaymentEntity,
  TransactionEntity,
} from '../transaction/entities';

export const entities = [
  PaymentMethodEntity,
  PaymentEntity,
  TransactionEntity,
  POSDepositEntity,
  CashDepositEntity,
  MinistryLocationEntity,
  LocationEntity,
  BankLocationEntity,
  MerchantEntity,
  FileUploadedEntity,
  ProgramDailyUploadEntity,
  FileIngestionRulesEntity,
  ProgramRequiredFileEntity,
  AlertDestinationEntity,
];
