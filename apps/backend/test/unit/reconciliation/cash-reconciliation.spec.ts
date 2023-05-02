import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchStatus } from '../../../src/common/const';
import { Ministries } from '../../../src/constants';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { AppLogger } from '../../../src/logger/logger.service';
import { CashReconciliationService } from '../../../src/reconciliation/cash-reconciliation.service';
import { PaymentEntity } from '../../../src/transaction/entities';
import { PaymentService } from '../../../src/transaction/payment.service';
import { getDateRange } from '../../mocks/const/date_range_mock';
import { getLocation } from '../../mocks/const/location_mock';
import { cashDeposits, cashPayments } from '../../mocks/mocks';

describe('CashReconciliationService', () => {
  let service: CashReconciliationService;
  let cashDepositService: DeepMocked<CashDepositService>;
  let paymentService: DeepMocked<PaymentService>;
  let logger: DeepMocked<AppLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashReconciliationService]
    })
      .useMocker(createMock)
      .compile();
    service = module.get<CashReconciliationService>(CashReconciliationService);
    logger = module.get(Logger);
    paymentService = module.get(PaymentService);
    cashDepositService = module.get(CashDepositService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(logger).toBeDefined();
    expect(paymentService).toBeDefined();
    expect(cashDepositService).toBeDefined();
  });

  it('should call cashDepositService and paymentService', async () => {
    const cashDepositServiceSpy = jest.spyOn(
      cashDepositService,
      'findCashDepositDatesByLocation'
    );
    const paymentServiceSpy = jest.spyOn(
      paymentService,
      'getAggregatedPaymentsByCashDepositDates'
    );
    const dateRange = getDateRange();
    const location = getLocation();
    const cashDepositServiceResult =
      await cashDepositService.findCashDepositDatesByLocation(
        Ministries.SBC,
        dateRange,
        location
      );
    const paymentServiceResult =
      await paymentService.getAggregatedPaymentsByCashDepositDates(
        dateRange,
        location
      );
    expect(cashDepositServiceSpy).toHaveBeenCalled();
    expect(paymentServiceSpy).toHaveBeenCalled();
    expect(cashDepositServiceResult).toBeDefined();
    expect(paymentServiceResult).toBeDefined();
  });

  it('should call check match', () => {
    const aggregatedPayments = paymentService.aggregatePayments(
      cashPayments as PaymentEntity[]
    );

    const spy = jest.spyOn(service, 'matchPaymentsToDeposits');
    service.matchPaymentsToDeposits(aggregatedPayments, cashDeposits);
    expect(spy).toBeCalled();
  });
  it('should return the same number of payments and deposits as it is called with ', () => {
    const aggregatedPayments = paymentService.aggregatePayments(
      cashPayments as PaymentEntity[]
    );
    const result = service.matchPaymentsToDeposits(
      aggregatedPayments,
      cashDeposits
    );

    expect(result.aggregatedPayments.length).toEqual(aggregatedPayments.length);
    expect(result.deposits.length).toEqual(cashDeposits.length);
  });

  it('should have a cash_deposit_match property defined if the status is set to match', () => {
    const aggregatedPayments = paymentService.aggregatePayments(
      cashPayments as PaymentEntity[]
    );
    const result = service.matchPaymentsToDeposits(
      aggregatedPayments,
      cashDeposits
    );
    const matchedPayments = result.aggregatedPayments.filter(
      (itm) => itm.status === MatchStatus.MATCH
    );

    const cashDepositIdsFromPayments = matchedPayments.flatMap((itm) =>
      itm.payments.map((payment) => payment.cash_deposit_match)
    );

    const matchedDeposits = result.deposits.filter(
      (itm) => itm.status === MatchStatus.MATCH
    );

    matchedDeposits.map((itm) => {
      expect(cashDepositIdsFromPayments.includes(itm)).toBeTruthy();
    });
  });
  it('should not have a cash_match_id set if it is not matched', () => {
    const aggregatedPayments = paymentService.aggregatePayments(
      cashPayments as PaymentEntity[]
    );
    const result = service.matchPaymentsToDeposits(
      aggregatedPayments,
      cashDeposits
    );
    const unmatchedPayments = result.aggregatedPayments
      .filter((itm) => itm.status !== MatchStatus.MATCH)
      .flatMap((itm) => itm.payments.map((payment) => payment));

    unmatchedPayments.map((itm) => {
      expect(itm.cash_deposit_match).toBeUndefined();
    });

    unmatchedPayments.map((itm) => {
      expect(itm.cash_deposit_match).toBeUndefined();
    });
  });

  it('should match based on the aggregated sum of payments to deposit', () => {
    const aggregatedPayments = paymentService.aggregatePayments(
      cashPayments as PaymentEntity[]
    );
    const result = service.matchPaymentsToDeposits(
      aggregatedPayments,
      cashDeposits
    );

    const matchedPayments = result.aggregatedPayments
      .filter((itm) => itm.status === MatchStatus.MATCH)
      .flatMap((itm) => itm.payments);

    const matchedDeposits = result.deposits.filter(
      (itm) => itm.status === MatchStatus.MATCH
    );

    matchedPayments.map((payment) => {
      const matchedDeposit = matchedDeposits.find(
        (deposit) => deposit === payment.cash_deposit_match
      );
      expect(matchedDeposit).toBeDefined();
      expect(matchedDeposit?.deposit_amt_cdn).toEqual(payment.amount);
    });
  });
});
