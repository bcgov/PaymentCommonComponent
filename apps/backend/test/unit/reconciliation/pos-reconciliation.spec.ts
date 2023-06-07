import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  roundThreeTimeHeuristic,
  roundTwoTimeHeuristic,
  setSomeDepositsToOneBusinessDayBehind,
  setSomePaymentsToTwentyMinutesLater,
  timeBetweenMatchedPaymentAndDeposit,
  unmatchedTestData,
} from './helpers';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { PosReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { MatchStatus } from '../../../src/common/const';
import {
  AggregatedDeposit,
  AggregatedPosPayment,
  PaymentMethodClassification,
} from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
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
  let roundFourPaymentMatches: PaymentEntity[];
  let roundFourDepositMatches: POSDepositEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosReconciliationService,
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
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      expect(payments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
      const matches = service.matchPosPaymentToPosDeposits(
        payments,
        service.buildPosDepositsDictionary(deposits),
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
        service.buildPosDepositsDictionary(
          deposits.filter((deposit) =>
            [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
              deposit.status
            )
          )
        ),
        PosHeuristicRound.ONE
      );
      expect(payments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
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
        service.buildPosDepositsDictionary(
          deposits.filter((deposit) =>
            [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
              deposit.status
            )
          )
        ),
        PosHeuristicRound.THREE
      );
      expect(payments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
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

      deposits = setSomeDepositsToOneBusinessDayBehind(deposits);

      matches = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        service.buildPosDepositsDictionary(
          deposits.filter((deposit) =>
            [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
              deposit.status
            )
          )
        ),
        PosHeuristicRound.THREE
      );

      expect(payments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
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
      deposits = setSomeDepositsToOneBusinessDayBehind(deposits);

      const depositsDictionary = service.buildPosDepositsDictionary(
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        )
      );

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
        PosHeuristicRound.ONE
      );

      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
        PosHeuristicRound.TWO
      );

      const matchedRoundThree = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
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
      const matchedDeposits = matches.map((itm) => itm.deposit);
      const matchedDepositsFromMatchedPayments = matches.map(
        (itm) => itm.payment.pos_deposit_match
      );
      expect(matchedDeposits).toEqual(
        expect.arrayContaining(matchedDepositsFromMatchedPayments)
      );
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

      const depositsDictionary = service.buildPosDepositsDictionary(
        deposits.filter((deposit) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            deposit.status
          )
        )
      );

      const matchedRoundOne = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
        PosHeuristicRound.ONE
      );

      const matchedRoundTwo = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
        PosHeuristicRound.TWO
      );

      const matchedRoundThree = service.matchPosPaymentToPosDeposits(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        ),
        depositsDictionary,
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
      expect(matches.map((itm) => itm.payment.id)).toEqual(
        expect.arrayContaining(
          payments
            .filter((itm) => itm.status === MatchStatus.MATCH)
            .map((itm) => itm.id)
        )
      );
      expect(matches.map((itm) => itm.deposit.id)).toEqual(
        expect.arrayContaining(
          deposits
            .filter((itm) => itm.status === MatchStatus.MATCH)
            .map((itm) => itm.id)
        )
      );
    });
    it('should return the same number of matched payments as the original array contained', () => {
      expect(matches.length).toEqual(
        payments.filter((itm) => itm.status === MatchStatus.MATCH).length
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
  describe('heuristic round four', () => {
    beforeAll(() => {
      // create some data that will not match
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];

      const aggregatedPayments = service.aggregatePayments(
        payments.filter((payment) =>
          [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(
            payment.status
          )
        )
      );

      const aggregatedDeposits = service.aggregateDeposits(
        deposits
      ) as unknown as POSDepositEntity[];
      const matchedRoundFour = service.matchPosPaymentToPosDepositsRoundFour(
        aggregatedPayments,
        service.buildPosDepositsDictionary(aggregatedDeposits),
        PosHeuristicRound.FOUR
      );

      roundFourPaymentMatches = matchedRoundFour.flatMap((itm) => itm.payments);
      roundFourDepositMatches = matchedRoundFour.flatMap((itm) => itm.deposits);
    });
    it('should aggregate the deposits and build the deposit dictionary', () => {
      const aggregatedDeposits = service.aggregateDeposits(
        deposits
      ) as unknown as POSDepositEntity[];

      const depositsDictionary =
        service.buildPosDepositsDictionary(aggregatedDeposits);

      const dictKeys = Object.keys(depositsDictionary);

      expect(dictKeys).toEqual(
        expect.arrayContaining(
          aggregatedDeposits.map((itm) => itm.transaction_amt.toString())
        )
      );
    });

    it('should match based on date, aggregated amount, method ', () => {
      const reaggregatedPayments = service.aggregatePayments(
        roundFourPaymentMatches
      );
      const reaggregatedDeposits = service.aggregateDeposits(
        roundFourDepositMatches
      );
      expect(
        reaggregatedPayments.map((aggregatedPayment: AggregatedPosPayment) => ({
          amount: aggregatedPayment.amount,
          payment_method: aggregatedPayment.payment_method,
        }))
      ).toEqual(
        expect.arrayContaining(
          reaggregatedDeposits.map((aggregatedDeposit: AggregatedDeposit) => ({
            amount: aggregatedDeposit.transaction_amt,
            payment_method: aggregatedDeposit.payment_method,
          }))
        )
      );
    });
    it('should match many to many', () => {
      const matchedDepositIds = roundFourDepositMatches.map((itm) => itm.id);
      const matchedDepositsFromMatchedPayments =
        roundFourPaymentMatches.flatMap((itm) =>
          itm.round_four_matches?.map((itm) => itm.id)
        );
      expect(Array.from(new Set(matchedDepositIds))).toEqual(
        Array.from(new Set(matchedDepositsFromMatchedPayments))
      );
    });
  });
});
