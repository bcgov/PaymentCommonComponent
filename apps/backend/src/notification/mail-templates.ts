export enum MAIL_TEMPLATE_ENUM {
  FILES_MISSING_ALERT = 'FILES_MISSING_ALERT',
  FILE_VALIDATION_ALERT = 'FILE_VALIDATION_ALERT',
  LOCATION_MISSING_ALERT = 'LOCATION_MISSING_ALERT',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
}

export const MailTemplate = {
  [MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT]: {
    id: '0bbd896d-ed4b-474a-af2a-4cbec36e5c5b',
    name: MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
    fields: ['date', 'ministryDivision', 'error'],
  },
  [MAIL_TEMPLATE_ENUM.FILE_VALIDATION_ALERT]: {
    id: 'a2e43741-623d-4531-b9c1-a5edd0a2f49b',
    name: MAIL_TEMPLATE_ENUM.FILE_VALIDATION_ALERT,
    fields: ['date', 'ministryDivision', 'error'],
  },
  [MAIL_TEMPLATE_ENUM.LOCATION_MISSING_ALERT]: {
    id: 'c12c38a9-af85-40f3-92d8-b871161c926d',
    name: MAIL_TEMPLATE_ENUM.LOCATION_MISSING_ALERT,
    fields: ['date', 'ministryDivision', 'error'],
  },
  [MAIL_TEMPLATE_ENUM.MONTHLY_REPORT]: {
    id: '7d896692-1b83-4ec0-b5bf-b66c0c44593e',
    name: MAIL_TEMPLATE_ENUM.MONTHLY_REPORT,
    fields: ['month_name', 'link', 'username'],
  },
};
