import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { MasterDataLocationEntity } from '../location/entities';
import { LocationEntity } from '../location/entities/location.entity';
import { MerchantLocationEntity } from '../location/entities/merchant-location.entity';
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
  MasterDataLocationEntity,
  MerchantLocationEntity,
  LocationEntity,
  FileUploadedEntity,
  ProgramDailyUploadEntity,
  FileIngestionRulesEntity,
  ProgramRequiredFileEntity,
  AlertDestinationEntity,
];
