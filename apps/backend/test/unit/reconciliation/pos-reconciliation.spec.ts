import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { parse, differenceInMinutes } from 'date-fns';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { POSReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { posDeposits, posPayments } from './../../mocks/mocks';
import { MatchStatus } from '../../../src/common/const';

import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { AppLogger } from '../../../src/logger/logger.service';
import { PaymentService } from '../../../src/transaction/payment.service';
import { locations } from '../../mocks/const/locations';

describe('POSReconciliationService', () => {
  let service: POSReconciliationService;
  let posDepositService: DeepMocked<PosDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let logger: DeepMocked<AppLogger>;
  let payments: PaymentEntity[];
  let deposits: POSDepositEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [POSReconciliationService]
    })
      .useMocker(createMock)
      .compile();
    payments = posPayments.map((itm) => ({
      ...itm,
      status: MatchStatus.PENDING,
      timestamp: parse(
        `${itm.transaction.transaction_date}${itm.transaction.transaction_time}`,
        'yyyy-MM-ddHH:mm:ss',
        new Date()
      )
    })) as PaymentEntity[];
    deposits = posDeposits.map((itm) => ({
      ...itm,
      status: MatchStatus.PENDING,
      timestamp: parse(
        `${itm.transaction_date}${itm.transaction_time}`,
        'yyyy-MM-ddHH:mm:ss',
        new Date()
      )
    }));

    service = module.get<POSReconciliationService>(POSReconciliationService);
    posDepositService = module.get(PosDepositService);
    paymentService = module.get(PaymentService);
    logger = module.get(Logger);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(posDepositService).toBeDefined();
    expect(paymentService).toBeDefined();
    expect(logger).toBeDefined();
  });

  describe('matchPaymentsToDeposits', () => {
    it('should match payments to deposits according to first round of heuristics', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const result = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );

      /**
       * Verify ministry/program match
       */
      result.forEach((itm) =>
        expect(itm.deposit.metadata.program).toEqual(
          itm.payment.transaction.source_id
        )
      );
      /**
       * Verify location match
       */
      result.forEach((itm) =>
        expect(
          locations
            .filter(
              (loc) => loc.location_id === itm.payment.transaction.location_id
            )
            .map((itm) => itm.merchant_id)
            .includes(itm.deposit.merchant_id)
        ).toBe(true)
      );
      /**
       * Verify time/date match
       */
      result.forEach((itm) =>
        expect(
          differenceInMinutes(itm.payment.timestamp, itm.deposit.timestamp)
        ).toBeLessThanOrEqual(timeDiff)
      );
      /**
       * Verify payment_method match
       */
      result.forEach((itm) =>
        expect(itm.payment.payment_method.method).toEqual(
          itm.deposit.payment_method.method
        )
      );
      /**
       * Verify amount match
       */
      result.forEach((itm) =>
        expect(itm.payment.amount).toEqual(itm.deposit.transaction_amt)
      );
      expect(spy).toBeCalled();
    });

    it('should match payments to deposits according to second round of heuristics', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 1440;
      const timeDiff = roundOneTimeDiff;
      service.matchPosPaymentToPosDeposits(payments, deposits, timeDiff);
      expect(spy).toBeCalled();
    });

    it('should update the status to MATCH for all matched payments and deposits', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const result = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      result.forEach((itm) =>
        expect(itm.payment.status).toBe(MatchStatus.MATCH)
      );
      result.forEach((itm) =>
        expect(itm.deposit.status).toBe(MatchStatus.MATCH)
      );
      const matchedDeposits = result.map((itm) => itm.deposit);
      const matchedPayments = result.map((itm) => itm.payment);
      expect(
        matchedDeposits.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
      expect(
        matchedPayments.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);

      expect(result).toBeDefined();
      expect(spy).toBeCalled();
    });

    it('should record the deposit match id', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const result = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );

      const matchedPayments = result.map((itm) => itm.payment);
      const matchedDeposits = result.map((itm) => itm.deposit);
      // /**
      //  * Verify that all payments have a corresponding pos_deposit_match
      //  */
      matchedPayments.forEach((itm) =>
        expect(itm.pos_deposit_match).toBeDefined()
      );
      matchedDeposits.forEach((itm) => {
        expect(
          matchedPayments.map((itm) => itm.pos_deposit_match).includes(itm)
        );
      });

      expect(matchedDeposits.length).toBe(matchedPayments.length);
      expect(matchedPayments.every((itm) => itm.pos_deposit_match)).toBe(true);

      expect(result).toBeDefined();
      expect(spy).toBeCalled();
    });

    it('should not match the same deposit to multiple payments', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const result = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matchedPayments = result.map((itm) => itm.payment);
      const matchedDeposits = result.map((itm) => itm.deposit);
      /**
       * Verify that pos_deposit_ids that are recorded are unique
       */
      matchedPayments.forEach((itm) =>
        expect(itm.pos_deposit_match).toBeDefined()
      );
      const recordedDepositIds = matchedPayments.map(
        (itm) => itm.pos_deposit_match
      );
      const uniqueRecordedDepositIds = Array.from(
        new Set(recordedDepositIds.map((itm) => itm))
      );
      expect(recordedDepositIds.length).toBe(uniqueRecordedDepositIds.length);

      /**
       * Verify that all payments have a corresponding pos_deposit_match
       */
      expect(matchedDeposits.length).toBe(matchedPayments.length);

      expect(result).toBeDefined();
      expect(spy).toBeCalled();
    });

    it('should not change the status of unmatched payment and deposits', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const badPayments = payments.map((itm: PaymentEntity) => ({
        ...itm,
        timestamp: itm.timestamp,
        amount: 0
      }));
      const matches = service.matchPosPaymentToPosDeposits(
        badPayments,
        deposits,
        timeDiff
      );
      const paymentExceptions = payments.filter(
        (itm) => !matches.map((itm) => itm.payment).includes(itm)
      );
      const depositExceptions = deposits.filter(
        (itm) => !matches.map((itm) => itm.deposit).includes(itm)
      );
      /**
       * Verify unmatched payments and deposits are not changed
       */
      paymentExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      depositExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      expect(matches).toBeDefined();
      expect(spy).toBeCalled();
    });

    it('should not record the pos_deposit_match id if no match is found', () => {
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      const roundOneTimeDiff = 5;
      const timeDiff = roundOneTimeDiff;
      const badPayments = payments.map((itm: PaymentEntity) => ({
        ...itm,
        timestamp: itm.timestamp,
        amount: 0
      }));
      const matches = service.matchPosPaymentToPosDeposits(
        badPayments,
        deposits,
        timeDiff
      );
      const paymentExceptions = payments.filter(
        (itm) => !matches.map((itm) => itm.payment).includes(itm)
      );
      const depositExceptions = deposits.filter(
        (itm) => !matches.map((itm) => itm.deposit).includes(itm)
      );

      paymentExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      depositExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      /**
       * Verify that pos_deposit_match is not defined
       */
      paymentExceptions.forEach((itm) =>
        expect(itm.pos_deposit_match).toBe(undefined)
      );
      /**
       * Verify that no deposit ids which are not matched are recorded in the payments
       */
      expect(
        matches.map((itm) =>
          depositExceptions.find(
            (deposit) => deposit === itm.payment.pos_deposit_match
          )
        )
      ).toMatchObject([]);
      const matchedDeposits = matches.map((itm) => itm.deposit);
      const matchedPayments = matches.map((itm) => itm.payment);
      /**
       * Verify that all matched deposits have a corresponding pos_deposit_match
       */
      matchedDeposits.forEach((deposit) =>
        expect(
          matchedPayments.find((itm) => itm.pos_deposit_match === deposit)
        ).toBeTruthy()
      );
      expect(matches).toBeDefined();
      expect(spy).toBeCalled();
    });
  });
});
