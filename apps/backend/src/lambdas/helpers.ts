import { SNSMessage } from 'aws-lambda';
import { parse } from 'date-fns';

import { ReconciliationMessage } from './interface';

export const parseSNSMessage = (message: SNSMessage['Message']) => {
  const parsedMessage: ReconciliationMessage =
    typeof message === 'string' ? JSON.parse(message) : message;
  const from_date = parse(parsedMessage.period.from, 'yyyy-MM-dd', new Date());

  const to_date = parse(parsedMessage.period.to, 'yyyy-MM-dd', new Date());

  return {
    program: parsedMessage.program,
    bypass_parse_validity: parsedMessage.bypass_parse_validity,
    period: { from: from_date, to: to_date },
  };
};
