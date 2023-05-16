import { createMock } from '@golevelup/ts-jest';
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
import { PaymentService } from '../../../src/transaction/payment.service';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';

describe('POSReconciliationService', () => {
  let service: POSReconciliationService;

  let payments: PaymentEntity[];
  let deposits: POSDepositEntity[];
  let paymentExceptions: PaymentEntity[];
  let depositExceptions: POSDepositEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POSReconciliationService,
        {
          provide: PaymentService,
          useValue: createMock<PaymentService>(),
        },
        {
          provide: PosDepositService,
          useValue: createMock<PosDepositService>(),
        },
        {
          provide: Logger,
          useValue: createMock<Logger>(),
        },
      ],
    }).compile();

    const data = new MockData(PaymentMethodClassification.POS);

    payments = data.paymentsMock as PaymentEntity[];
    deposits = data.depositsMock as POSDepositEntity[];

    service = module.get<POSReconciliationService>(POSReconciliationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the service and its dependencies', () => {
      expect(service).toBeDefined();

      expect(payments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
      const matches = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        5
      );
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('matchPaymentsToDeposits first round heuristics', () => {
    it('should verify the test data status is PENDING prior to running reconciliation', () => {
      payments.forEach((itm) => expect(itm.status).toBe(MatchStatus.PENDING));
      deposits.forEach((itm) => expect(itm.status).toBe(MatchStatus.PENDING));
    });

    it('calls a function to match based on the first round of heuristics', () => {
      const timeDiff = 5;

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      expect(matchedRoundOne.length).toBeGreaterThan(0);
    });

    it('should verify the time difference between matches on round one is 5 minutes or less', () => {
      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        5
      );
      matchedRoundOne.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(5)
      );
    });

    it('should have updated the status from PENDING to MATCH', () => {
      const timeDiff = 5;
      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      matchedRoundOne.forEach((itm) => {
        expect(itm.deposit.status === MatchStatus.MATCH);
        expect(itm.payment.status === MatchStatus.MATCH);
      });
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
      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      //verify that there are matches to test
      expect(matchedRoundTwo.length).toBeGreaterThan(0);
    });

    it('should verify the time difference between matched payments and deposits is less than 24 hours and greater than 5 minutes', () => {
      const timeDiff = 1440;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      //set round one matches
      service.matchPosPaymentToPosDeposits(payments, deposits, 5);
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
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
      const timeDiff = 1440;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      matchedRoundTwo.forEach((itm) => {
        expect(itm.deposit.status === MatchStatus.MATCH);
        expect(itm.payment.status === MatchStatus.MATCH);
      });
    });
  });

  describe('verify matched fields on all matches', () => {
    it('should find matches for each heuristic round', () => {
      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        5
      );

      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        1440
      );

      const matches = [...matchedRoundOne, ...matchedRoundTwo];

      expect(matches.length).toBeGreaterThan(0);
    });
    it('should have updated the status from pending to matched', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      matches.forEach((itm) => {
        expect(itm.deposit.status === MatchStatus.MATCH);
        expect(itm.payment.status === MatchStatus.MATCH);
      });
    });

    it('should match by location on all matched payments/deposits', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
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
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      matches.forEach((itm) => {
        expect(itm.deposit.metadata.program).toBe(
          itm.payment.transaction.source_id
        );
      });
    });

    it('should match payment method on all matched payments/deposits', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      matches.forEach((itm) => {
        expect(itm.payment.payment_method.method).toBe(
          itm.deposit.payment_method.method
        );
      });
    });

    it('should match amount on all matched payments/deposits', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      matches.forEach((itm) => {
        expect(itm.payment.amount).toBe(itm.deposit.transaction_amt);
      });
    });

    it('should set the correct pos_deposit_match in the payment on all matched payments/deposits', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      matches.forEach((itm) => {
        expect(itm.payment?.pos_deposit_match?.id).toBe(itm.deposit.id);
      });
    });

    it('should have an equal number of matched payments/deposits', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
      expect(matches.map((itm) => itm.deposit).length).toBe(
        matches.map((itm) => itm.payment).length
      );
    });

    it('should not match the same deposit to multiple payments', () => {
      let timeDiff = 5;

      //set some to 20 minutes later to verify that we're using the second round time heuristic
      payments = setSomePaymentsToTwentyMinutesLater(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      timeDiff = 1440;
      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments,
        deposits,
        timeDiff
      );
      const matches = [...matchedRoundOne, ...matchedRoundTwo];
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
      const unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      payments = [...payments, ...unMatchedData.payments];
      deposits = [...deposits, ...unMatchedData.deposits];

      const timeDiffRoundTwo = 1440;

      service.matchPosPaymentToPosDeposits(
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
      const unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      const matches = service.matchPosPaymentToPosDeposits(
        unMatchedData.payments,
        unMatchedData.deposits,
        5
      );

      paymentExceptions = unMatchedData.payments.filter(
        (payment) => payment.status === MatchStatus.PENDING
      );
      depositExceptions = unMatchedData.deposits.filter(
        (deposit) => deposit.status === MatchStatus.PENDING
      );
      expect(matches.map((itm) => itm.payment)).toStrictEqual(
        expect.arrayContaining(
          payments.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
      expect(matches.map((itm) => itm.deposit)).toStrictEqual(
        expect.arrayContaining(
          deposits.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
    });
    it('should return the same number of matched payments and deposits as the original array contained', () => {
      const unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      payments = [...payments, ...unMatchedData.payments];
      deposits = [...deposits, ...unMatchedData.deposits];

      const timeDiffRoundTwo = 1440;

      jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      const matches = service.matchPosPaymentToPosDeposits(
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
      expect(matches.map((itm) => itm.payment).length).toEqual(
        payments.filter((itm) => itm.status === MatchStatus.MATCH).length
      );
      expect(matches.map((itm) => itm.deposit).length).toEqual(
        deposits.filter((itm) => itm.status === MatchStatus.MATCH).length
      );
    });
    it('should not include unmatched items in the returned array', () => {
      const unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      payments = [...payments, ...unMatchedData.payments];
      deposits = [...deposits, ...unMatchedData.deposits];

      const timeDiffRoundTwo = 1440;

      jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      const matches = service.matchPosPaymentToPosDeposits(
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
