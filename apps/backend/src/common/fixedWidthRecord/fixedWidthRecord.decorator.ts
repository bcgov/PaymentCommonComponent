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
