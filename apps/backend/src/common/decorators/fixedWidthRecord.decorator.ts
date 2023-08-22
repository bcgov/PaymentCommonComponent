/* eslint-disable @typescript-eslint/no-explicit-any */

// TOD [CCFPCM-397]: Can we type more here?
import 'reflect-metadata';
export interface ColumnOptions {
  start: number;
  width: number;
  format?:
    | BooleanOptions
    | DecimalOptions
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
export interface BooleanOptions {
  type: DataType.Boolean;
}
export interface DecimalOptions {
  type: DataType.Decimal;
}
export interface CardOptions {
  type: DataType.Card;
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
export interface StringOptions {
  type: DataType.String;
}

export enum DataType {
  Decimal = 'Decimal',
  Boolean = 'Boolean',
  Integer = 'Integer',
  Date = 'Date',
  Time = 'Time',
  Card = 'Card',
  TransactionCode = 'TransactionCode',
  TransactionType = 'TransactionType',
  MerchantLocation = 'MerchantLocation',
  String = 'String',
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
