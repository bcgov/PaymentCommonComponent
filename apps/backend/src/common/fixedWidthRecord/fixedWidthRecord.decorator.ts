import 'reflect-metadata';

export interface ColumnOptions {
  start: number;
  width: number;
  format?:
    | FloatOptions
    | IntOptions
    | DateOptions
    | TimeOptions
    | CardOptions
    | TransCodeOptions
    | TransactionTypeOptions;
  delimiter?: string;
  example?: unknown;
}
export interface CardOptions {
  type: DataType.Card;
}
export interface TransCodeOptions {
  type: DataType.TransactionCode;
}
export interface FloatOptions {
  type: DataType.Float;
  precision?: number;
}

export interface DateOptions {
  type: DataType.Date;
}

export interface TimeOptions {
  type: DataType.Time;
}

export interface IntOptions {
  type: DataType.Integer;
}
export interface TransactionTypeOptions {
  type: DataType.TransactionType;
}

export enum DataType {
  Float = 'Float',
  Integer = 'Integer ',
  Date = 'Date',
  Time = 'Time',
  Card = 'Card',
  TransactionCode = 'TransactionCode',
  TransactionType = 'TransactionType'
}

export const transactionType = (value: string) => {
  switch (value) {
    case '200':
      return { code: 200, description: 'Cash' };
    case '201':
      return { code: 201, description: 'Service BC' };
    case '202':
      return { code: 202, description: 'Debit' };
    case '203':
      return { code: 203, description: 'Mastercard POS' };
    case '204':
      return { code: 204, description: 'Mastercard' };
    case '205':
      return { code: 205, description: 'Mastercard POS' };
    case '206':
      return { code: 206, description: 'Visa' };
  }
};

export const cardVendor = (type: string) => {
  switch (type) {
    case 'M':
      return { type: type, vendor: 'MasterCard' };
    case 'V':
      return { type: type, vendor: 'VISA' };
    case 'AX':
      return { type: type, vendor: 'Amex' };
    case 'PV':
      return { type: type, vendor: 'VISA Debit' };
    case 'MD':
      return { type: type, vendor: 'Debit MasterCard' };
    default:
      return { type: type, vendor: 'N/A' };
  }
};

export const transactionCode = (code: string) => {
  switch (code) {
    case '10':
      return { code, description: 'Purchase (P)', type: '+' };
    case '11':
      return { code, description: 'Preauth purchase (PA)', type: '+' };
    case '12':
      return {
        code,
        description: 'Preauth purchase complete (PAC)',
        type: '+'
      };
    case '14':
      return { code, description: 'Merchandise return (R)', type: '-' };
    case '21':
      return { code, description: 'Purchase adjustment', type: '-' };
    case '22':
      return { code, description: 'Merchandise Return Adjustment', type: '+' };
  }
};

export const timeFormat = (value: string[]) =>
  `${value[0]}${value[1]}:${value[2]}${value[3]}`;

export const dateFormat = (value: string[]) =>
  `${[value[0], value[1], value[2], value[3]].join('')}-${[
    value[4],
    value[5]
  ].join('')}-${[value[6], value[7]].join('')}`;

export const ColumnMetadataKey = Symbol('Column:metadata');
export const ColumnVariableKey = Symbol('Column:variable');

export function Column(options: ColumnOptions): any {
  return function (target: any, propertyKey: string | symbol) {
    if (!Reflect.hasOwnMetadata(ColumnVariableKey, target.constructor)) {
      Reflect.defineMetadata(ColumnVariableKey, [], target.constructor);
    }
    Reflect.getOwnMetadata(ColumnVariableKey, target.constructor).push(
      propertyKey
    );
    Reflect.defineMetadata(ColumnMetadataKey, options, target, propertyKey);
  };
}
