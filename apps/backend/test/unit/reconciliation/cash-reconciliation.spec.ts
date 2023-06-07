import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { aggregatePayments } from './helpers';
import { MatchStatus } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { AppLogger } from '../../../src/logger/logger.service';
import { CashReconciliationService } from '../../../src/reconciliation/cash-reconciliation.service';
import { AggregatedCashPayment } from '../../../src/reconciliation/types';
import { PaymentEntity } from '../../../src/transaction/entities/payment.entity';
import { PaymentService } from '../../../src/transaction/payment.service';
import { MockData } from '../../mocks/mocks';

describe('CashReconciliationService', () => {
  let service: CashReconciliationService;
  let aggregatedCashPayments: AggregatedCashPayment[];
  let deposits: CashDepositEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashReconciliationService,
        {
          provide: PaymentService,
          useValue: createMock<PaymentService>(),
        },
        {
          provide: CashDepositService,
          useValue: createMock<CashDepositService>(),
        },
        {
          provide: Logger,
          useValue: createMock<Logger>(),
        },
        { provide: AppLogger, useValue: createMock<AppLogger>() },

        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: createMock<Repository<CashDepositEntity>>(),
        },
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: createMock<Repository<PaymentEntity>>(),
        },
      ],
    }).compile();

    service = module.get<CashReconciliationService>(CashReconciliationService);
    const data = new MockData(PaymentMethodClassification.CASH);
    aggregatedCashPayments = aggregatePayments(data.paymentsMock);
    deposits = data.depositsMock as CashDepositEntity[];
  });

  describe('initialization', () => {
    it('should create the service and its dependencies', () => {
      expect(service).toBeDefined();
      expect(aggregatedCashPayments.length).toBeGreaterThan(0);
      expect(deposits.length).toBeGreaterThan(0);
    });
  });

  describe('checkMatch', () => {
    it('calls matchPaymentsToDeposits', () => {
      expect(aggregatedCashPayments.length).toEqual(deposits.length);
      expect(
        aggregatedCashPayments.every((itm) =>
          itm.payments.map(
            (p) => p.payment_method.method === PaymentMethodClassification.CASH
          )
        )
      ).toBe(true);
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      expect(matches.length).toBeGreaterThan(0);
    });
  });
  describe('matchPaymentsToDeposits', () => {
    it('calls matchPaymentsToDeposits', () => {
      expect(aggregatedCashPayments.length).toEqual(deposits.length);
      expect(
        aggregatedCashPayments.every((itm) =>
          itm.payments.map(
            (p) => p.payment_method.method === PaymentMethodClassification.CASH
          )
        )
      ).toBe(true);
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should match payments to deposits', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      const paymentMatches = matches.map((itm) => itm.aggregatedCashPayment);
      const depositMatches = matches.map((itm) => itm.deposit);
      expect(
        paymentMatches.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
      expect(
        depositMatches.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
    });
    it('checks that there is one fiscal_close_date per cash_deposit date in the matches array', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      const paymentMatches = matches.map((itm) => itm.aggregatedCashPayment);
      const depositMatches = matches.map((itm) => itm.deposit);
      const matchedPaymentsDates = paymentMatches.flatMap((itm) =>
        itm.payments.map((p) => p.transaction.fiscal_close_date)
      );
      const uniqueDates = [...new Set(matchedPaymentsDates)];
      expect(uniqueDates.length).toBe(depositMatches.length);
    });
    it('checks that all cash deposits marked match have a cash_deposit_match_id in the matches payments array', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );

      const depositMatches = matches.map((itm) => itm.deposit);
      expect(
        deposits.filter((itm) => itm.status === MatchStatus.MATCH)
      ).toEqual(expect.arrayContaining(depositMatches));
    });

    it('checks that all cash_deposit_match is set to deposit id', async () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      const paymentMatches = matches.map((itm) => itm.aggregatedCashPayment);
      const depositMatches = matches.map((itm) => itm.deposit);
      expect(
        paymentMatches
          .flatMap((itm) => itm.payments)
          .every((itm) => itm.cash_deposit_match !== null)
      ).toBeTruthy();
      expect(
        paymentMatches
          .flatMap((itm) => itm.payments)
          .map((itm) => itm.cash_deposit_match)
      ).toStrictEqual(expect.arrayContaining(depositMatches));
    });
    it('checks the amount matched', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );

      expect(
        matches.every(
          (itm) =>
            itm.aggregatedCashPayment.amount.toNumber() ===
            itm.deposit.deposit_amt_cdn
        )
      ).toBe(true);
    });
    it('checks the correct deposit id is set to each matched group of payments', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      const depositMatches = matches.map((itm) => itm.deposit);
      const AggregatedCashPaymentMatches = matches.map(
        (itm) => itm.aggregatedCashPayment
      );

      expect(
        AggregatedCashPaymentMatches.flatMap((itm) =>
          itm.payments.map((p) => p.cash_deposit_match)
        )
      ).toEqual(expect.arrayContaining(depositMatches));
    });
    it('checks that deposits are matched only once', () => {
      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      const AggregatedCashPaymentMatches = matches.map(
        (itm) => itm.aggregatedCashPayment
      );
      const depositMatches = matches.map((itm) => itm.deposit);

      const depositMatchesFromPaymentArray =
        AggregatedCashPaymentMatches.flatMap(
          (itm) => itm.payments.map((p) => p.cash_deposit_match)[0]
        );

      expect(depositMatchesFromPaymentArray).toEqual(
        expect.arrayContaining(depositMatches)
      );
    });
    it('should not have a cash_match_id set if it is not matched', () => {
      service.matchPaymentsToDeposits(aggregatedCashPayments, deposits);

      const unmatchedPayments = aggregatedCashPayments
        .filter((itm) => itm.status !== MatchStatus.MATCH)
        .flatMap((itm) => itm.payments.map((payment) => payment));

      expect(
        unmatchedPayments.every((itm) => itm.cash_deposit_match === undefined)
      ).toBe(true);
    });
  });
  describe('matchPaymentsToDeposits - verifies against false matches', () => {
    it('should not match any payments to deposits', () => {
      const data = new MockData(PaymentMethodClassification.CASH);
      aggregatedCashPayments = aggregatePayments(data.paymentsMock);
      const newData = new MockData(PaymentMethodClassification.CASH);
      deposits = newData.depositsMock as CashDepositEntity[];

      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      expect(matches.length).toBe(0);

      const paymentMatches = matches.map((itm) => itm.aggregatedCashPayment);
      const depositMatches = matches.map((itm) => itm.deposit);

      expect(paymentMatches.length).toBe(0);
      expect(depositMatches.length).toBe(0);
    });

    it('should not change the status of unmatched items', () => {
      const data = new MockData(PaymentMethodClassification.CASH);
      aggregatedCashPayments = aggregatePayments(data.paymentsMock);
      const newData = new MockData(PaymentMethodClassification.CASH);
      deposits = newData.depositsMock as CashDepositEntity[];

      const matches = service.matchPaymentsToDeposits(
        aggregatedCashPayments,
        deposits
      );
      expect(matches.length).toBe(0);

      expect(
        aggregatedCashPayments
          .flatMap((itm) => itm.payments)
          .forEach((itm) => itm.status === MatchStatus.PENDING)
      );
      expect(deposits.forEach((itm) => itm.status === MatchStatus.PENDING));
    });
  });
});
