import {
  isArray,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DistributionDTO } from '../dto/accounting.dto';

@ValidatorConstraint()
export class AreDistributionsValid implements ValidatorConstraintInterface {
  errorMessage: string;
  constructor() {
    this.errorMessage = `Distribution Values are incorrect.`;
  }

  public async validate(distributions: DistributionDTO[]) {
    const credits: Array<DistributionDTO> = [];
    const debits: Array<DistributionDTO> = [];

    if (!isArray(distributions)) {
      this.errorMessage = `Distributions must be an array`;
      return false;
    }

    const creditSum = credits.reduce((sum, dist) => {
      return sum + dist.line_amount;
    }, 0);

    const debitSum = debits.reduce((sum, dist) => {
      return sum + dist.line_amount;
    }, 0);

    if (debits.length === 0) {
      this.errorMessage = `At least 1 debit entry required`;
      return false;
    }

    if (credits.length === 0) {
      this.errorMessage = `At least 1 credit entry required`;
      return false;
    }

    if (debits.length !== 1) {
      this.errorMessage = `There can be only one debit entry but ${debits.length} are found`;
      return false;
    }

    if (creditSum !== debitSum) {
      this.errorMessage = `Credit and Debit Sums must match. There is a difference of ${
        debitSum - creditSum
      } found`;
      return false;
    }

    return true;
  }

  defaultMessage() {
    return this.errorMessage;
  }
}
