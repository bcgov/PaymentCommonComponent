import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { subBusinessDays } from 'date-fns';
import {
  timeBetweenMatchedPaymentAndDeposit,
  unmatchedTestData,
} from './helpers';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { PosReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { MatchStatus } from '../../../src/common/const';
import {
  Ministries,
  PaymentMethodClassification,
} from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { LoggerModule } from '../../../src/logger/logger.module';
import { heuristics as ministryHeuristics } from '../../../src/reconciliation/ministryHeuristics';
import { PosHeuristicRound } from '../../../src/reconciliation/types';
import { PaymentService } from '../../../src/transaction/payment.service';
import { MockData } from '../../mocks/mocks';

describe('service', () => {
  let service: PosReconciliationService;
  let notmatchedDeposits: POSDepositEntity[];
  let notmatchedPayments: PaymentEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
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

    service.setMatchedDeposits([]);
    service.setMatchedPayments([]);
    const data = new MockData(PaymentMethodClassification.POS);
    const pendingPayments = data.paymentsMock as PaymentEntity[];
    const pendingDeposits = data.depositsMock as POSDepositEntity[];
    service.setHeuristics(ministryHeuristics[Ministries.SBC]);
    service.setPendingDeposits(pendingDeposits);
    service.setPendingPayments(pendingPayments);
    expect(pendingPayments?.length).toBeGreaterThan(0);
    expect(pendingDeposits?.length).toBeGreaterThan(0);

    service.setHeuristicMatchRound(service.heuristics[0]);

    const { unmatchedDeposits, unmatchedPayments } = service.filterAndSetMatch(
      service.pendingPayments,
      service.pendingDeposits
    );
    notmatchedDeposits = unmatchedDeposits;
    notmatchedPayments = unmatchedPayments;
  });

  describe('find matches', () => {
    it('should create the service and its dependencies', () => {
      expect(service.matchedPayments.length).toBeGreaterThan(0);
      expect(service.matchedDeposits.length).toBeGreaterThan(0);

      expect(notmatchedPayments.length + service.matchedPayments.length).toBe(
        service.pendingPayments.length
      );
      expect(notmatchedDeposits.length + service.matchedDeposits.length).toBe(
        service.pendingDeposits.length
      );
      console.log(service.matchedDeposits.length, 'matchedPayments');
    });

    it('should have set the status to MATCH', () => {
      expect(
        service.matchedPayments.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
      expect(
        service.matchedDeposits.every((itm) => itm.status === MatchStatus.MATCH)
      ).toBe(true);
    });

    it('should match payment method on all matched payments/deposits', () => {
      expect(
        service.matchedPayments.every(
          (itm) =>
            itm.pos_deposit_match?.payment_method.method ===
            itm.payment_method.method
        )
      ).toBe(true);
    });

    it('should match amount on all matched payments/deposits', () => {
      expect(
        service.matchedPayments.every(
          (itm) => itm.amount === itm.pos_deposit_match?.transaction_amt
        )
      ).toBe(true);
    });

    it('should set the correct pos_deposit_match in the payment on all matched payments/deposits', () => {
      expect(
        service.matchedDeposits
          .filter((itm) => itm.heuristic_match_round !== PosHeuristicRound.FOUR)
          .map((itm) => itm.id)
      ).toEqual(
        expect.arrayContaining(
          service.matchedPayments
            .filter(
              (itm) => itm.heuristic_match_round !== PosHeuristicRound.FOUR
            )
            .map((itm) => itm.pos_deposit_match?.id)
        )
      );
    });

    it('should have an equal number of matched payments/deposits', () => {
      expect(
        service.matchedPayments.filter(
          (itm) => itm.heuristic_match_round !== PosHeuristicRound.FOUR
        ).length
      ).toBe(
        service.matchedDeposits.filter(
          (itm) => itm.heuristic_match_round !== PosHeuristicRound.FOUR
        ).length
      );
    });

    it('should not match the same deposit to multiple payments', () => {
      const recordedDepositIds = service.matchedPayments
        .map((itm) => {
          const deposit = service.matchedDeposits
            .filter(
              (itm) => itm.heuristic_match_round !== PosHeuristicRound.FOUR
            )
            .find((deposit) => deposit.id === itm?.pos_deposit_match?.id);
          if (deposit) {
            return deposit.id;
          }
        })
        .filter((itm) => itm !== undefined);
      const uniqueRecordedDepositIds = Array.from(
        new Set(recordedDepositIds.map((itm) => itm))
      );
      expect(recordedDepositIds.length).toBe(uniqueRecordedDepositIds.length);
    });
  });

  describe('roundOne heuristics', () => {
    it('should verify the time difference between matches on round one is 5 minutes or less', () => {
      service.matchedPayments
        .filter((itm) => itm.heuristic_match_round === PosHeuristicRound.ONE)
        .forEach((itm: PaymentEntity) => {
          const deposit = service.matchedDeposits
            .filter(
              (itm) => itm.heuristic_match_round === PosHeuristicRound.ONE
            )
            .find((deposit) => deposit.id === itm?.pos_deposit_match?.id);
          if (deposit) {
            expect(
              timeBetweenMatchedPaymentAndDeposit(itm, deposit!)
            ).toBeLessThanOrEqual(5);
          }
        });
    });
  });

  describe('roundTwo heuristics', () => {
    it('should verify the time difference between matches on round two is > 5 minutes and < 24 hours', () => {
      service.matchedPayments
        .filter((itm) => itm.heuristic_match_round === PosHeuristicRound.TWO)
        .forEach((itm: PaymentEntity) => {
          const deposit = service.matchedDeposits
            .filter(
              (itm) => itm.heuristic_match_round === PosHeuristicRound.TWO
            )
            .find((deposit) => deposit.id === itm?.pos_deposit_match?.id);
          if (deposit) {
            expect(
              timeBetweenMatchedPaymentAndDeposit(itm, deposit!)
            ).toBeGreaterThanOrEqual(5);
            expect(
              timeBetweenMatchedPaymentAndDeposit(itm, deposit!)
            ).toBeLessThanOrEqual(1440);
          }
        });
    });
  });

  describe('roundThree heuristics', () => {
    it('should verify the time difference between matches on round three is one business day', () => {
      service.matchedPayments
        .filter((itm) => itm.heuristic_match_round === PosHeuristicRound.THREE)
        .every((payment: PaymentEntity) => {
          const deposit = service.matchedDeposits
            .filter(
              (itm) => itm.heuristic_match_round === PosHeuristicRound.THREE
            )
            .find((deposit) => deposit.id === payment?.pos_deposit_match?.id);
          if (deposit) {
            expect(subBusinessDays(payment.timestamp, 1)).toEqual(
              deposit.transaction_date
            );
          }
        });
    });

    describe('verifies that unmatched data will not be set as match', () => {
      beforeEach(() => {
        service.setMatchedDeposits([]);
        service.setMatchedPayments([]);

        // create some data that will not match
        const data = new MockData(PaymentMethodClassification.POS);
        const pendingPayments = data.paymentsMock as PaymentEntity[];
        const pendingDeposits = data.depositsMock as POSDepositEntity[];

        const unMatchedData = unmatchedTestData(
          new MockData(PaymentMethodClassification.POS)
        );

        service.setPendingPayments([
          ...pendingPayments,
          ...unMatchedData.payments,
        ]);
        service.setPendingDeposits([
          ...pendingDeposits,
          ...unMatchedData.deposits,
        ]);

        service.setHeuristics(ministryHeuristics[Ministries.SBC]);
        service.setHeuristicMatchRound(service.heuristics[0]);

        const { unmatchedDeposits, unmatchedPayments } =
          service.filterAndSetMatch(
            service.pendingPayments,
            service.pendingDeposits
          );
        notmatchedDeposits = unmatchedDeposits;
        notmatchedPayments = unmatchedPayments;
      });

      it('should not include unmatched items in the returned array', () => {
        expect(service.matchedPayments).not.toEqual(
          expect.arrayContaining(notmatchedPayments)
        );
        expect(service.matchedDeposits).not.toEqual(
          expect.arrayContaining(notmatchedDeposits)
        );
      });

      it('should not change the status of unmatched payment and deposits', () => {
        expect(
          notmatchedPayments.every((itm) => itm.status === MatchStatus.PENDING)
        ).toBe(true);
        expect(
          notmatchedDeposits.every((itm) => itm.status === MatchStatus.PENDING)
        ).toBe(true);
      });

      it('should not record the pos_deposit_match id if no match is found', () => {
        expect(
          notmatchedPayments.every((itm) => itm.pos_deposit_match === undefined)
        ).toBe(true);
      });
    });
  });
});
