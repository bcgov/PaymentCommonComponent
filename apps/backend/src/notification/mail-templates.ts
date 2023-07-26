export enum MAIL_TEMPLATE_ENUM {
  FILES_MISSING_ALERT = 'FILES_MISSING_ALERT',
  FILE_VALIDATION_ALERT = 'FILE_VALIDATION_ALERT',
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
};
