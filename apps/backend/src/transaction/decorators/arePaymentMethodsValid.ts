import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  isArray
} from 'class-validator';
import { PaymentDTO } from '../dto/payment.dto';
import { TransactionDTO } from '../dto/transaction.dto';

@ValidatorConstraint()
export class ArePaymentMethodsValid implements ValidatorConstraintInterface {
  errorMessage: string;
  constructor() {
    this.errorMessage = `Payment Method Values are incorrect.`;
  }

  public async validate(
    paymentMethods: PaymentDTO[],
    args: ValidationArguments
  ) {
    const sales = args.object as TransactionDTO;

    if (!isArray(paymentMethods)) {
      this.errorMessage = `Distributions must be an array`;
      return false;
    }

    const paymentMethodSum = paymentMethods.reduce((sum, method) => {
      return sum + method.amount;
    }, 0);

    if (sales.total_payment_amount !== paymentMethodSum) {
      this.errorMessage = `Sum Of Amounts by Payment Method does not equal Sale total.`;
      return false;
    }
    return true;
  }
  defaultMessage() {
    return this.errorMessage;
  }
}
