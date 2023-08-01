/**
 * Extract the file date from the file name
 * exmaple filename: 'sbc/SBC_SALES_2026_03_03_23_17_37.JSON'
 */
export const extractDateFromTXNFileName = (fileName: string): string => {
  const name = fileName.split('/')[1].split('.')[0];
  const date = name.replace('SBC_SALES_', '').replace(/[_]/gi, '-');
  return date.slice(0, 10);
};
/**
 * Validates the filename from SBC Garms. Example filename: 'sbc/SBC_SALES_2026_03_03_23_17_37.JSON',
 * @param filename
 * @returns
 *
 */
export const validateSbcGarmsFileName = (filename: string): boolean => {
  try {
    return /sbc\/\SBC_SALES_(20)\d{2}_(0[1-9]|1[0-2])_(0[1-9]|[12][0-9]|3[01])_\d{2}_\d{2}_\d{2}.JSON/gi.test(
      filename
    );
  } catch (err) {
    throw new Error(`Error validating file name: ${filename}`);
  }
};

/**
 * Used to generate a local SNS message for running lambdas locally
 * @param message
 * @returns
 */
export const generateLocalSNSMessage = (message: unknown) => {
  return {
    Records: [
      {
        EventVersion: '',
        EventSubscriptionArn: '',
        EventSource: '',
        Sns: {
          Message: JSON.stringify(message),
          MessageId: '',
          MessageAttributes: {},
          Type: '',
          TopicArn: '',
          Subject: '',
          UnsubscribeUrl: '',
          SignatureVersion: '',
          Timestamp: new Date().toISOString(),
          Signature: '',
          SigningCertUrl: '',
        },
      },
    ],
  };
};
