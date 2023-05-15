import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  setSomePaymentsToTwentyMinutesLater,
  timeBetweenMatchedPaymentAndDeposit,
  unmatchedTestData,
} from './helpers';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { POSReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { MatchStatus } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { AppLogger } from '../../../src/logger/logger.service';
import { PaymentService } from '../../../src/transaction/payment.service';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';

describe('POSReconciliationService', () => {
  let service: POSReconciliationService;
  let posDepositService: DeepMocked<PosDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let logger: DeepMocked<AppLogger>;
  let payments: jest.Mocked<PaymentEntity[]>;
  let deposits: jest.Mocked<POSDepositEntity[]>;
  let paymentExceptions: jest.Mocked<PaymentEntity[]>;
  let depositExceptions: jest.Mocked<POSDepositEntity[]>;
  let matchedRoundOne: jest.Mocked<
    { payment: PaymentEntity; deposit: POSDepositEntity }[]
  >;
  let matchedRoundTwo: jest.Mocked<
    { payment: PaymentEntity; deposit: POSDepositEntity }[]
  >;
  let matches: jest.Mocked<
    { payment: PaymentEntity; deposit: POSDepositEntity }[]
  >;
  let unMatchedData: jest.Mocked<{
    payments: PaymentEntity[];
    deposits: POSDepositEntity[];
  }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [POSReconciliationService],
    })
      .useMocker(createMock)
      .compile();

    const data = new MockData(PaymentMethodClassification.POS);

    payments = data.paymentsMock as PaymentEntity[];
    deposits = data.depositsMock as POSDepositEntity[];

    service = module.get<POSReconciliationService>(POSReconciliationService);
    posDepositService = module.get(PosDepositService);
    paymentService = module.get(PaymentService);
    logger = module.get(Logger);
    service.verifyMatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the service and its dependencies', () => {
      expect(service).toBeDefined();
      expect(posDepositService).toBeDefined();
      expect(paymentService).toBeDefined();
      expect(logger).toBeDefined();
    });
  });

  describe('matchPaymentsToDeposits first round heuristics', () => {
    it('should verify the test data status is PENDING prior to running reconciliation', () => {
      payments.forEach((itm) => expect(itm.status).toBe(MatchStatus.PENDING));
      deposits.forEach((itm) => expect(itm.status).toBe(MatchStatus.PENDING));
    });

    it('calls a function to match based on the first round of heuristics', () => {
      const timeDiff = 5;
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );

      expect(spy).toHaveBeenCalledTimes(1);
      /**
       * Test that calling matchPosPaymentToDeposits calls verifyMatch
       */
      expect(service.verifyMatch).toBeCalled();
    });

    it('should verify the time difference between matches on round one is 5 minutes or less', () => {
      matchedRoundOne.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(5)
      );
    });

    it('should have updated the status from PENDING to MATCH', () => {
      const matchedDeposits = matchedRoundOne.map((itm) => itm.deposit);
      const matchedPayments = matchedRoundOne.map((itm) => itm.payment);
      const updatedPaymentsToMatched = payments.filter(
        (itm) => itm.status === MatchStatus.MATCH
      );
      const unmatchedPayments = payments.filter(
        (itm) => itm.status === MatchStatus.PENDING
      );
      const updatedDepositsToMatched = deposits.filter(
        (itm) => itm.status === MatchStatus.MATCH
      );
      const unmatchedDeposits = deposits.filter(
        (itm) => itm.status === MatchStatus.PENDING
      );

      expect(
        matchedDeposits.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
      expect(
        matchedPayments.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);

      //the original array items which have been set to match should equal the returned matched items
      expect(updatedPaymentsToMatched).toStrictEqual(
        expect.arrayContaining(matchedPayments)
      );
      expect(updatedDepositsToMatched).toStrictEqual(
        expect.arrayContaining(matchedDeposits)
      );

      // the total number of returned matched items + unmatched items from the original array should equal the length of the original array
      expect(unmatchedPayments.length + matchedPayments.length).toBe(
        payments.length
      );
      expect(unmatchedDeposits.length + matchedDeposits.length).toBe(
        deposits.length
      );
    });
  });

  describe('should match payments to deposits according to second round of heuristics', () => {
    it('checks that there are still pending items to match for round two', () => {
      expect(payments.some((itm) => itm.status === MatchStatus.PENDING)).toBe(
        true
      );
      expect(deposits.some((itm) => itm.status === MatchStatus.PENDING)).toBe(
        true
      );
    });
    it('calls matchPosPaymentToPosDeposits with the timeDiff set to second round time-heuristic ', () => {
      const timeDiff = 1440;
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');
      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      // Test that this is called only once
      expect(spy).toHaveBeenCalledTimes(1);

      // Test that calling matchPosPaymentToDeposits calls verifyMatch
      expect(service.verifyMatch).toBeCalled();
    });

    it('should verify the time difference between matched payments and deposits is less than 24 hours and greater than 5 minutes', () => {
      matchedRoundTwo.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(1440)
      );
      matchedRoundTwo.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeGreaterThan(5)
      );
    });

    it('should have updated the status from PENDING to MATCH', () => {
      matchedRoundTwo.forEach((itm) => {
        expect(itm.deposit.status === MatchStatus.MATCH);
        expect(itm.payment.status === MatchStatus.MATCH);
      });
    });
  });

  describe('verify matched fields on all matches', () => {
    it('calls matchPaymentAndDeposit once for each heuristic round', () => {
      let timeDiff = 5;
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      matches = [...matchedRoundOne, ...matchedRoundTwo];
      expect(spy).toHaveBeenCalledTimes(2);
      /**
       * Test that calling matchPosPaymentToDeposits calls verifyMatch
       */
      expect(service.verifyMatch).toBeCalled();
    });
    it('should have matched for both round one and two time heuristics', () => {
      matchedRoundTwo.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(1440)
      );
      matchedRoundTwo.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeGreaterThan(5)
      );
    });
    it('should have updated the status from pending to matched', () => {
      matches.forEach((itm) => {
        expect(itm.deposit.status === MatchStatus.MATCH);
        expect(itm.payment.status === MatchStatus.MATCH);
      });
    });

    it('should match by location on all matched payments/deposits', () => {
      matches.forEach((itm) => {
        const paymentLocation = locations.find(
          (loc) => loc.location_id === itm.payment.transaction.location_id
        );

        const depositLocation = locations.find(
          (loc) => loc.merchant_id === itm.deposit.merchant_id
        );

        expect(paymentLocation?.location_id).toBe(depositLocation?.location_id);
      });
    });

    it('should match ministry/program on all matched payments/deposits', () => {
      matches.forEach((itm) => {
        expect(itm.deposit.metadata.program).toBe(
          itm.payment.transaction.source_id
        );
      });
    });

    it('should match payment method on all matched payments/deposits', () => {
      matches.forEach((itm) => {
        expect(itm.payment.payment_method.method).toBe(
          itm.deposit.payment_method.method
        );
      });
    });

    it('should match amount on all matched payments/deposits', () => {
      matches.forEach((itm) => {
        expect(itm.payment.amount).toBe(itm.deposit.transaction_amt);
      });
    });

    it('should set the correct pos_deposit_match in the payment on all matched payments/deposits', () => {
      matches.forEach((itm) => {
        expect(itm.payment?.pos_deposit_match?.id).toBe(itm.deposit.id);
      });
    });

    it('should have an equal number of matched payments/deposits', () => {
      expect(matches.map((itm) => itm.deposit).length).toBe(
        matches.map((itm) => itm.payment).length
      );
    });

    it('should not match the same deposit to multiple payments', () => {
      const recordedDepositIds = matches.map(
        (itm) => itm.payment.pos_deposit_match
      );
      const uniqueRecordedDepositIds = Array.from(
        new Set(recordedDepositIds.map((itm) => itm))
      );
      expect(recordedDepositIds.length).toBe(uniqueRecordedDepositIds.length);
    });
  });

  describe('verifies that unmatched data will not be set as match', () => {
    it('calls matchPosPaymentsToDeposits with unmatched data', () => {
      // create some data that will not match
      unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      payments = [...payments, ...unMatchedData.payments];
      deposits = [...deposits, ...unMatchedData.deposits];

      const timeDiffRoundTwo = 1440;

      jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      matches = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiffRoundTwo
      );

      paymentExceptions = payments.filter(
        (payment) => payment.status === MatchStatus.PENDING
      );
      depositExceptions = deposits.filter(
        (deposit) => deposit.status === MatchStatus.PENDING
      );
    });

    it('should update the status of matched items in the original array and return a new array with the matched pairs', () => {
      expect(matches.map((itm) => itm.payment)).toEqual(
        expect.arrayContaining(
          payments.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
      expect(matches.map((itm) => itm.deposit)).toEqual(
        expect.arrayContaining(
          deposits.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
    });
    it('should return the same number of matched payments and deposits as the original array contained', () => {
      expect(matches.map((itm) => itm.payment).length).toEqual(
        payments.filter((itm) => itm.status === MatchStatus.MATCH).length
      );
      expect(matches.map((itm) => itm.deposit).length).toEqual(
        deposits.filter((itm) => itm.status === MatchStatus.MATCH).length
      );
    });
    it('should not include unmatched items in the returned array', () => {
      expect(matches).not.toEqual(
        expect.arrayContaining(unMatchedData.payments)
      );
      expect(matches).not.toEqual(
        expect.arrayContaining(unMatchedData.deposits)
      );
    });

    it('should not change the status of unmatched payment and deposits', () => {
      paymentExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      depositExceptions.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
    });

    it('should not record the pos_deposit_match id if no match is found', () => {
      paymentExceptions.forEach((itm) =>
        expect(itm.pos_deposit_match).toBeUndefined()
      );
    });
  });
});
