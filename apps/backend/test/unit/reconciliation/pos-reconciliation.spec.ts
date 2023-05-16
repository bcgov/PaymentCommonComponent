import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  differenceInBusinessDays,
  format,
  getTime,
  parse,
  subBusinessDays
} from 'date-fns';
import {
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
import { AppLogger } from '../../../src/logger/logger.service';
import { PosMatchHeuristics } from '../../../src/reconciliation/pos-heuristics';
import { PaymentService } from '../../../src/transaction/payment.service';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';

describe('PosReconciliationService', () => {
  let service: PosReconciliationService;
  let posDepositService: DeepMocked<PosDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let posMatchHeuristics: DeepMocked<PosMatchHeuristics>;
  let logger: DeepMocked<AppLogger>;
  let payments: jest.Mocked<PaymentEntity[]>;
  let deposits: POSDepositEntity[];
  let matches: jest.Mocked<
    { payment: PaymentEntity; deposit: POSDepositEntity }[]
  >;
  let unmatchedPayments: jest.Mocked<PaymentEntity[]>;
  let unmatchedDeposits: jest.Mocked<POSDepositEntity[]>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PosReconciliationService]
    })
      .useMocker(createMock)
      .compile();

    const data = new MockData(PaymentMethodClassification.POS);

    payments = data.paymentsMock as PaymentEntity[];
    deposits = data.depositsMock as POSDepositEntity[];
    matches = [];
    unmatchedPayments = [];
    unmatchedDeposits = [];
    service = module.get<PosReconciliationService>(PosReconciliationService);
    posMatchHeuristics = module.get(PosMatchHeuristics);
    posDepositService = module.get(PosDepositService);
    paymentService = module.get(PaymentService);
    logger = module.get(Logger);
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

  describe('findMatches - round one ', () => {
    beforeAll(() => {
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
        1
      );
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      expect(posMatchHeuristics.isMatch).toBeCalled();
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
    beforeEach(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      matches = [];
      payments[2].transaction.transaction_time = format(
        getTime(
          parse(
            `${payments[2].transaction.transaction_date} ${payments[2].transaction.transaction_time}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date()
          )
        ) +
          1000 * 60 * 20,
        'HH:mm:ss'
      );
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
        2
      );
    });
    it('should find matches', async () => {
      const spy = jest.spyOn(posMatchHeuristics, 'isMatch');
      expect(posMatchHeuristics.isMatch).toBeCalledTimes(30);
      expect(spy).toHaveBeenCalledTimes(30);
      expect(matches.length).toBeGreaterThan(0);
    });
    it('should verify the time difference between matches on round two is > 5 minutes and < 24 hours', () => {
      matches.forEach(({ payment, deposit }) =>
        expect(
          timeBetweenMatchedPaymentAndDeposit(payment, deposit)
        ).toBeLessThanOrEqual(1440)
      );
    });
  });
  describe('findMatches - round three', () => {
    beforeEach(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      matches = [];
      payments[3].transaction.transaction_date = format(
        subBusinessDays(new Date(payments[1].transaction.transaction_date), 1),
        'yyyy-MM-dd'
      );
      matches = service.matchPosPaymentToPosDeposits(payments, deposits, 3);
    });
    it('should find matches', async () => {
      const spy = jest.spyOn(posMatchHeuristics, 'isMatch');
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      expect(spy).toHaveBeenCalledTimes(30);
      expect(posMatchHeuristics.isMatch).toBeCalledTimes(30);
    });
    it('should verify the time difference between matches on round three is one business day', () => {
      matches.forEach(({ payment, deposit }) =>
        expect(
          differenceInBusinessDays(
            parse(
              payment.transaction.transaction_date,
              'yyyy-MM-dd',
              new Date()
            ),
            parse(deposit.transaction_date, 'yyyy-MM-dd', new Date())
          )
        ).toBeLessThanOrEqual(1)
      );
    });
  });
  describe('findMatches', () => {
    beforeAll(() => {
      const data = new MockData(PaymentMethodClassification.POS);
      payments = data.paymentsMock as PaymentEntity[];
      deposits = data.depositsMock as POSDepositEntity[];
      matches = [];
      payments[2].transaction.transaction_time = format(
        getTime(
          parse(
            `${payments[2].transaction.transaction_date} ${payments[2].transaction.transaction_time}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date()
          )
        ) +
          1000 * 60 * 20,
        'HH:mm:ss'
      );
      payments[3].transaction.transaction_date = format(
        subBusinessDays(new Date(payments[1].transaction.transaction_date), 1),
        'yyyy-MM-dd'
      );
      const spy = jest.spyOn(service, 'matchPosPaymentToPosDeposits');

      //set some to 20 minutes later to verify that we're using the second round time heuristic
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
        1
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
        2
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
        3
      );

      matches = [...matchedRoundOne, ...matchedRoundTwo, ...matchedRoundThree];
      expect(spy).toHaveBeenCalledTimes(3);
      expect(posMatchHeuristics.isMatch).toBeCalled();
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should have updated the status from pending to matched', () => {
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
    beforeAll(() => {
      // create some data that will not match
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
        1
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
        2
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
        3
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
      unmatchedPayments.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
      unmatchedDeposits.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.PENDING)
      );
    });

    it('should not record the pos_deposit_match id if no match is found', () => {
      unmatchedPayments.forEach((itm) =>
        expect(itm.pos_deposit_match).toBeUndefined()
      );
    });
  });
});
