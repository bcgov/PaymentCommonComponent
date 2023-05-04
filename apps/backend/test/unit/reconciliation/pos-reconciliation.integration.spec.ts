import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { parse } from 'date-fns';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { POSReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentMethodEntity } from './../../../src/transaction/entities/payment-method.entity';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { MatchStatus } from '../../../src/common/const';
import {
  Ministries,
  PaymentMethodClassification
} from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../../../src/location/entities';
import { AppLogger } from '../../../src/logger/logger.service';
import { ReconciliationType } from '../../../src/reconciliation/types/const';
import { PaymentService } from '../../../src/transaction/payment.service';
import { getDateRange } from '../../mocks/const/date_range_mock';
import { getLocation } from '../../mocks/const/location_mock';
import { MockData } from '../../mocks/generateData';

interface MockParams {
  location: LocationEntity;
  program: Ministries;
  date: string;
}
describe('POSReconciliationService', () => {
  let service: POSReconciliationService;
  let posDepositService: DeepMocked<PosDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let logger: DeepMocked<AppLogger>;
  let posPayments: PaymentEntity[];
  let posDeposits: POSDepositEntity[];
  let mockParams: MockParams;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [POSReconciliationService]
    })
      .useMocker(createMock)
      .compile();

    const data = new MockData();
    const baseData = {
      dateRange: getDateRange(),
      program: Ministries.SBC,
      location: getLocation()
    };
    const posTransactionsMock = data.generateTransactions(
      baseData,
      PaymentMethodClassification.POS,
      MatchStatus.PENDING
    );
    posPayments = posTransactionsMock.flatMap((itm) =>
      itm.payments.map((payment) => ({
        ...payment,
        status: MatchStatus.PENDING,
        payment_method: new PaymentMethodEntity(payment.payment_method),
        timestamp: parse(
          `${itm.transaction_date}${itm.transaction_time}`,
          'yyyy-MM-ddHH:mm:ss',
          new Date()
        ),
        transaction: {
          ...itm
        }
      }))
    ) as PaymentEntity[];

    const mockPosDeposits = data.generatePOSDeposits(
      baseData,
      {
        source_file_name: 'TDI34',
        date_uploaded: new Date('2020-01-01'),
        source_file_length: 0,
        source_file_line: 0,
        program: Ministries.SBC
      },
      posTransactionsMock,
      MatchStatus.PENDING
    );

    posDeposits = mockPosDeposits.map((itm: POSDepositEntity) => ({
      ...itm,
      status: MatchStatus.PENDING,
      timestamp: parse(
        `${itm.transaction_date}${itm.transaction_time}`,
        'yyyy-MM-ddHH:mm:ss',
        new Date()
      )
    }));

    mockParams = {
      location: baseData.location,
      program: Ministries.SBC,
      date: baseData.dateRange.to_date
    };

    service = module.get<POSReconciliationService>(POSReconciliationService);
    posDepositService = module.get(PosDepositService);
    paymentService = module.get(PaymentService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(posDepositService).toBeDefined();
    expect(paymentService).toBeDefined();
    expect(logger).toBeDefined();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('reconcile POS', () => {
    it('calls reconciliation with the correct params, and then gets the payments and deposits from their respective services', async () => {
      const spy = jest.spyOn(service, 'reconcile');

      await service.reconcile(
        mockParams.location,
        mockParams.program,
        mockParams.date
      );

      expect(spy).toBeCalled();
    });
    it('calls the find methods for payments and deposits exactly one per service', async () => {
      const spy = jest.spyOn(service, 'reconcile');

      const paymentServiceSpy = jest
        .spyOn(paymentService, 'findPosPayments')
        .mockResolvedValue(posPayments);
      const posDepositServiceSpy = jest
        .spyOn(posDepositService, 'findPOSDeposits')
        .mockResolvedValue(posDeposits);
      await service.reconcile(
        mockParams.location,
        mockParams.program,
        mockParams.date
      );
      expect(spy).toBeCalled();
      expect(paymentServiceSpy).toBeCalledTimes(1);
      expect(posDepositServiceSpy).toBeCalledTimes(1);
    });

    it('calls payment service and deposit service update methods exactly twice per service', async () => {
      const spy = jest.spyOn(service, 'reconcile');

      const logSpy = jest.spyOn(logger, 'log');
      const updatePaymentSpy = jest.spyOn(paymentService, 'updatePayments');
      const updateDepositSpy = jest.spyOn(posDepositService, 'updateDeposits');

      await service.reconcile(
        mockParams.location,
        mockParams.program,
        mockParams.date
      );
      expect(updateDepositSpy).toBeCalledTimes(2);
      expect(updatePaymentSpy).toBeCalledTimes(2);
      expect(logSpy).toBeCalledTimes(4);
      expect(spy).toBeCalled();
    });

    it('should return the expected number of exceptions and matches for both payments and deposits', async () => {
      const spy = jest.spyOn(service, 'reconcile');

      jest
        .spyOn(paymentService, 'findPosPayments')
        .mockResolvedValue(posPayments);
      jest
        .spyOn(posDepositService, 'findPOSDeposits')
        .mockResolvedValue(posDeposits);

      const pendingPayments = await paymentService.findPosPayments(
        mockParams.date,
        mockParams.location,
        MatchStatus.PENDING
      );

      const pendingDeposits = await posDepositService.findPOSDeposits(
        mockParams.date,
        Ministries.SBC,
        mockParams.location,
        MatchStatus.PENDING
      );

      const matchSpy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      const roundOneMatches = service.matchPosPaymentToPosDeposits(
        pendingPayments,
        pendingDeposits,
        5
      );

      const roundTwoMatches = service.matchPosPaymentToPosDeposits(
        pendingPayments,
        pendingDeposits,
        1440
      );
      expect(matchSpy).toBeCalledTimes(2);

      const matches = [...roundOneMatches, ...roundTwoMatches];
      jest.spyOn(paymentService, 'updatePayments').mockResolvedValue(
        matches
          .map((itm) => itm.payment)
          .map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.MATCH
          }))
      );

      jest.spyOn(posDepositService, 'updateDeposits').mockResolvedValue(
        matches
          .map((itm) => itm.deposit)
          .map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.MATCH
          }))
      );

      const matchedPayments = await paymentService.updatePayments(
        matches.map((itm) => itm.payment)
      );
      const matchedDeposits = await posDepositService.updateDeposits(
        matches.map((itm) => itm.deposit)
      );

      const paymentExceptions = await Promise.all(
        await paymentService.updatePayments(
          pendingPayments
            .filter((itm) => itm.status === MatchStatus.PENDING)
            .map((itm) => ({
              ...itm,
              timestamp: itm.timestamp,
              status: MatchStatus.EXCEPTION
            }))
        )
      );
      const depositExceptions = await Promise.all(
        await posDepositService.updateDeposits(
          pendingDeposits
            .filter((itm) => itm.status === MatchStatus.PENDING)
            .map((itm) => ({
              ...itm,
              timestamp: itm.timestamp,
              status: MatchStatus.EXCEPTION
            }))
        )
      );
      const result = await service.reconcile(
        mockParams.location,
        mockParams.program,
        mockParams.date
      );
      expect(result).toBeDefined();
      expect(spy).toBeCalledWith(
        mockParams.location,
        mockParams.program,
        mockParams.date
      );

      const expectedResultObject = {
        transaction_date: mockParams.date,
        type: ReconciliationType.POS,
        location_id: mockParams.location.location_id,
        total_deposits_pending: pendingDeposits.length,
        total_payments_pending: pendingPayments.length,
        total_matched_payments: matchedPayments.length,
        total_matched_deposits: matchedDeposits.length,
        total_payment_exceptions: paymentExceptions.length,
        total_deposit_exceptions: depositExceptions.length
      };

      expect(result).toMatchObject(expectedResultObject);
    });
  });
});
