import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  roundThreeTimeHeuristic,
  roundTwoTimeHeuristic,
  setSomePaymentsToOneBusinessDayBehind,
  setSomePaymentsToTwentyMinutesLater,
  timeBetweenMatchedPaymentAndDeposit,
  unmatchedTestData,
} from './helpers';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { PosReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { MatchStatus } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { PosMatchHeuristics } from '../../../src/reconciliation/pos-heuristics';
import { PosHeuristicRound } from '../../../src/reconciliation/types';
import { PaymentService } from '../../../src/transaction/payment.service';
import { MockData } from '../../mocks/mocks';

describe('PosReconciliationService', () => {
  let service: PosReconciliationService;

  let payments: PaymentEntity[];
  let deposits: POSDepositEntity[];
  let matches: { payment: PaymentEntity; deposit: POSDepositEntity }[];
  let unmatchedPayments: PaymentEntity[];
  let unmatchedDeposits: POSDepositEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosReconciliationService,
        PosMatchHeuristics,
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
    service = module.get<PosReconciliationService>(PosReconciliationService);
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
        PosHeuristicRound.ONE
      );
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('findMatches - round one ', () => {
    beforeAll(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      matches = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.ONE
      );
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should verify the time difference between matches on round one is 5 minutes or less', () => {
      matches.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(5)
      );
    });
    it('should have set the status to MATCH', () => {
      matches.forEach(({ payment, deposit }) => {
        expect(payment.status).toEqual(MatchStatus.MATCH);
        expect(deposit.status).toEqual(MatchStatus.MATCH);
      });
    });
  });

  describe('findMatches - round two', () => {
    beforeAll(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      matches = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.THREE
      );
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
    });
    it('should find matches', async () => {
      expect(
        matches.every(
          (itm) =>
            itm.payment.status === MatchStatus.MATCH &&
            itm.deposit.status === MatchStatus.MATCH
        )
      ).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
    });
    it('should verify the time difference between matches on round two is > 5 minutes and < 24 hours', () => {
      expect(
        matches.some((itm) => roundTwoTimeHeuristic(itm.payment, itm.deposit))
      ).toBe(true);
    });
  });
  describe('findMatches - round three', () => {
    beforeAll(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];

      payments = setSomePaymentsToOneBusinessDayBehind(payments);

      const matches = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.THREE
      );

      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
    });
    it('should find matches', async () => {
      expect(
        matches.every(
          (itm) =>
            itm.payment.status === MatchStatus.MATCH &&
            itm.deposit.status === MatchStatus.MATCH
        )
      ).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
    });
    it('should verify the time difference between matches on round three is one business day', () => {
      expect(
        matches.some((itm) => roundThreeTimeHeuristic(itm.payment, itm.deposit))
      ).toBe(true);
    });
  });
  describe('findMatches - run all three heuristics rounds', () => {
    beforeAll(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      payments = setSomePaymentsToTwentyMinutesLater(payments);
      payments = setSomePaymentsToOneBusinessDayBehind(payments);

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.ONE
      );

      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.TWO
      );

      const matchedRoundThree = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.THREE
      );

      matches = [...matchedRoundOne, ...matchedRoundTwo, ...matchedRoundThree];
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      expect(
        matches.every(
          (itm) =>
            itm.deposit.status === MatchStatus.MATCH &&
            itm.payment.status === MatchStatus.MATCH
        )
      ).toBe(true);
    });

    it('should match payment method on all matched payments/deposits', () => {
      expect(
        matches.every(
          (itm) =>
            itm.deposit.payment_method.method ===
            itm.payment.payment_method.method
        )
      ).toBe(true);
    });

    it('should match amount on all matched payments/deposits', () => {
      expect(
        matches.every(
          (itm) => itm.payment.amount === itm.deposit.transaction_amt
        )
      ).toBe(true);
    });

    it('should set the correct pos_deposit_match in the payment on all matched payments/deposits', () => {
      expect(
        matches.every((itm) => itm.payment.pos_deposit_match === itm.deposit)
      ).toBe(true);
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
    beforeAll(() => {
      // create some data that will not match
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];

      const unMatchedData = unmatchedTestData(
        new MockData(PaymentMethodClassification.POS)
      );

      payments = [...payments, ...unMatchedData.payments];
      deposits = [...deposits, ...unMatchedData.deposits];

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.ONE
      );

      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.TWO
      );

      const matchedRoundThree = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        ),
        PosHeuristicRound.THREE
      );

      matches = [...matchedRoundOne, ...matchedRoundTwo, ...matchedRoundThree];

      unmatchedPayments = payments.filter(
        (payment) => payment.status === MatchStatus.PENDING
      );
      unmatchedDeposits = deposits.filter(
        (deposit) => deposit.status === MatchStatus.PENDING
      );
    });
    it('should update the status of matched items in the original array and return a new array with the matched pairs', () => {
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
      expect(matches).not.toEqual(
        expect.arrayContaining(
          payments.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
      expect(matches).not.toEqual(
        expect.arrayContaining(
          deposits.filter((itm) => itm.status === MatchStatus.MATCH)
        )
      );
    });
    it('should not include unmatched items in the returned array', () => {
      expect(matches.map((itm) => itm.payment)).not.toEqual(
        expect.arrayContaining(
          payments.filter((itm) => itm.status === MatchStatus.PENDING)
        )
      );
      expect(matches.map((itm) => itm.deposit)).not.toEqual(
        expect.arrayContaining(
          deposits.filter((itm) => itm.status === MatchStatus.PENDING)
        )
      );
    });

    it('should not change the status of unmatched payment and deposits', () => {
      expect(
        unmatchedPayments.every((itm) => itm.status === MatchStatus.PENDING)
      ).toBe(true);
      expect(
        unmatchedDeposits.every((itm) => itm.status === MatchStatus.PENDING)
      ).toBe(true);
    });

    it('should not record the pos_deposit_match id if no match is found', () => {
      expect(
        unmatchedPayments.every((itm) => itm.pos_deposit_match === undefined)
      ).toBe(true);
    });
  });
});
