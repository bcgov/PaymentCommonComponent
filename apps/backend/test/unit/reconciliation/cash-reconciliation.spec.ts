import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { aggregatedPayments } from './helpers';
import { MatchStatus } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { AppLogger } from '../../../src/logger/logger.service';
import { CashReconciliationService } from '../../../src/reconciliation/cash-reconciliation.service';
import { AggregatedPayment } from '../../../src/reconciliation/types';
import { PaymentEntity } from '../../../src/transaction/entities/payment.entity';
import { PaymentService } from '../../../src/transaction/payment.service';
import { MockData } from '../../mocks/mocks';

describe('CashReconciliationService', () => {
  let service: CashReconciliationService;
  let cashDepositService: DeepMocked<CashDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let logger: DeepMocked<AppLogger>;
  let payments: jest.Mocked<AggregatedPayment[]>;
  let deposits: jest.Mocked<CashDepositEntity[]>;
  let matches: jest.Mocked<
    { deposit: CashDepositEntity; payment: AggregatedPayment }[]
  >;
  let matchedAggregatedPayments: jest.Mocked<AggregatedPayment[]>;
  let matchedDeposits: jest.Mocked<CashDepositEntity[]>;
  let matchedPayments: jest.Mocked<PaymentEntity[]>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashReconciliationService]
    })
      .useMocker(createMock)
      .compile();

    const data = new MockData(PaymentMethodClassification.POS);

    service = module.get<CashReconciliationService>(CashReconciliationService);
    payments = aggregatedPayments(data.paymentsMock);
    deposits = data.depositsMock as CashDepositEntity[];
    cashDepositService = module.get(CashDepositService);
    paymentService = module.get(PaymentService);
    logger = module.get(Logger);
    service.checkMatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the service and its dependencies', () => {
      expect(service).toBeDefined();
      expect(cashDepositService).toBeDefined();
      expect(paymentService).toBeDefined();
      expect(logger).toBeDefined();
    });
  });
  describe('checkMatch', () => {
    it('calls matchPaymentsToDeposits', () => {
      const spy = jest.spyOn(service, 'matchPaymentsToDeposits');
      service.matchPaymentsToDeposits(payments, deposits);
      expect(spy).toBeCalledTimes(1);
      expect(service.checkMatch).toBeCalled();
    });
  });
  describe('matchPaymentsToDeposits', () => {
    it('calls matchPaymentsToDeposits', () => {
      jest.spyOn(service, 'matchPaymentsToDeposits');
      matches = service.matchPaymentsToDeposits(payments, deposits);
      matchedAggregatedPayments = matches.map((itm) => itm.payment);
      matchedDeposits = matches.map((itm) => itm.deposit);
      matchedPayments = matchedAggregatedPayments.flatMap(
        (itm) => itm.payments
      );
    });
    it('should match payments to deposits', () => {
      matchedAggregatedPayments.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.MATCH)
      );
      matchedDeposits.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.MATCH)
      );
      matchedPayments.forEach((itm) =>
        expect(itm.status).toBe(MatchStatus.MATCH)
      );
    });
    it('checks that there is one fiscal_close_date per cash_deposit date in the matches array', () => {
      const matchedPaymentsDates = matchedPayments.map(
        (itm) => itm.transaction.fiscal_close_date
      );
      const uniqueDates = [...new Set(matchedPaymentsDates)];
      expect(uniqueDates.length).toBe(matchedDeposits.length);
    });
    it('checks that all cash deposits marked match have a cash_deposit_match_id in the matches payments array', () => {
      expect(
        deposits.filter((itm) => itm.status === MatchStatus.MATCH)
      ).toEqual(expect.arrayContaining(matchedDeposits));
    });

    it('checks that all cash_deposit_match is set to deposit id', async () => {
      expect(
        matchedPayments.every((itm) => itm.cash_deposit_match !== null)
      ).toBeTruthy();
      expect(
        matchedPayments.map((itm) => itm.cash_deposit_match)
      ).toStrictEqual(expect.arrayContaining(matchedDeposits));
    });
    it('checks the amount matched', () => {
      matches.forEach((itm) => {
        expect(itm.payment.amount).toBe(itm.deposit.deposit_amt_cdn);
      });
    });
    it('checks the correct deposit id is set to each matched group of payments', () => {
      matches.forEach((itm) => {
        expect(
          itm.payment.payments.flatMap((payment) => payment.cash_deposit_match)
        ).toStrictEqual(expect.arrayContaining([itm.deposit]));
      });
    });
    it('checks that deposits are matched only once', () => {
      const matchedDepositsFromPaymentArray = matchedPayments.map(
        (itm) => itm.cash_deposit_match
      );
      const uniqueDeposits = [...new Set(matchedDepositsFromPaymentArray)];
      expect(uniqueDeposits.length).toBe(matchedDeposits.length);
    });
    it('should not have a cash_match_id set if it is not matched', () => {
      const unmatchedPayments = payments
        .filter((itm) => itm.status !== MatchStatus.MATCH)
        .flatMap((itm) => itm.payments.map((payment) => payment));
      unmatchedPayments.map((itm) => {
        expect(itm.cash_deposit_match).toBeUndefined();
      });
      unmatchedPayments.map((itm) => {
        expect(itm.cash_deposit_match).toBeUndefined();
      });
    });

    describe('matchPaymentsToDeposits - verifies against false matches', () => {
      it('calls matchPaymentsToDeposits with unmatched data', () => {
        // generate mock data for payments
        const transactions = new MockData(PaymentMethodClassification.CASH)
          .transactionsMock;
        payments = aggregatedPayments(
          transactions.flatMap((itm) => itm.payments)
        );

        // generate new mock data for deposists - not matched to payments
        deposits = new MockData(PaymentMethodClassification.CASH)
          .depositsMock as CashDepositEntity[];

        jest.spyOn(service, 'matchPaymentsToDeposits');

        // extremely small chance of a match which would cause the test to fail due to random generation of data
        matches = service.matchPaymentsToDeposits(payments, deposits);
        matchedAggregatedPayments = matches.map((itm) => itm.payment);
        matchedDeposits = matches.map((itm) => itm.deposit);
        matchedPayments = matchedAggregatedPayments.flatMap(
          (itm) => itm.payments
        );
      });
      it('should not match any payments to deposits', () => {
        expect(matchedAggregatedPayments.length).toBe(0);
        expect(matchedDeposits.length).toBe(0);
      });
      it('should not change the status of unmatched items', () => {
        expect(payments.forEach((itm) => itm.status === MatchStatus.PENDING));
        expect(deposits.forEach((itm) => itm.status === MatchStatus.PENDING));
      });
    });
  });
});
