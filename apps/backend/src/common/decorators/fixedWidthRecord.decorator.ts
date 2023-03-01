/* eslint-disable @typescript-eslint/no-explicit-any */

// TODO: Can we type more here?
import 'reflect-metadata';
export interface ColumnOptions {
  start: number;
  width: number;
  format?:
    | DecimalOptions
    | FloatOptions
    | IntOptions
    | DateOptions
    | TimeOptions
    | CardOptions
    | TransactionTypeOptions
    | MerchantTypeOptions
    | TransactionCodeOptions;
  delimiter?: string;
  example?: unknown;
}
export interface DecimalOptions {
  type: DataType.Decimal;
}
export interface CardOptions {
  type: DataType.Card;
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

export interface MerchantTypeOptions {
  type: DataType.MerchantLocation;
}

export interface TransactionCodeOptions {
  type: DataType.TransactionCode;
}

export enum DataType {
  Decimal = 'Decimal',
  Float = 'Float',
  Integer = 'Integer ',
  Date = 'Date',
  Time = 'Time',
  Card = 'Card',
  TransactionCode = 'TransactionCode',
  TransactionType = 'TransactionType',
  MerchantLocation = 'MerchantLocation'
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
