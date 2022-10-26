import {
  isArray,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DistributionDTO } from '../../sales/dto/distribution.dto';
import { SalesDTO } from '../dto/sales.dto';

@ValidatorConstraint()
export class AreDistributionsValid implements ValidatorConstraintInterface {
  errorMessage: string;
  constructor() {
    this.errorMessage = `Distribution Values are incorrect.`;
  }

  public async validate(distributions: DistributionDTO[], args: ValidationArguments) {

    const sales = args.object as SalesDTO;
    const credits: Array<DistributionDTO> = [];
    const debits: Array<DistributionDTO> = [];

    if(!isArray(distributions)){
      this.errorMessage = `Distributions must be an array`;
      return false;
    }

    for (const dist of distributions) {
      (dist.line_code === 'C' ? credits : debits).push(dist);
    }

    const creditSum = credits.reduce((sum, dist) => {
      return sum + dist.line_amount;
    }, 0);

    const debitSum = debits.reduce((sum, dist) => {
      return sum + dist.line_amount;
    }, 0);

    
    if(debits.length === 0)
    {
      this.errorMessage = `At least 1 debit entry required`;
      return false;
    }
    
    if(credits.length === 0)
    {
      this.errorMessage = `At least 1 credit entry required`;
      return false;
    }
    
    if(debits.length !==1)
    {
      this.errorMessage = `There can be only one debit entry but ${debits.length} are found`;
      return false;
    }
    
    if (creditSum !== debitSum) {
      this.errorMessage = `Credit and Debit Sums must match. There is a difference of ${debitSum-creditSum} found`;
      return false;
    }

    if( sales.total_amount !== creditSum || sales.total_amount !== debitSum) {
      this.errorMessage = `Credit and Debit Sums do not match the Sales Total`;
      return false;
    }
    
    return true;
  }

  defaultMessage() {
    return this.errorMessage;
  }
}
