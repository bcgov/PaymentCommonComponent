import 'reflect-metadata';

export interface ColumnOptions {
  start: number;
  width: number;
  format?: FloatOptions | IntOptions;
  delimiter?: string;
}

export interface FloatOptions {
  type: DataType.Float;
  precision?: number;
}

export interface IntOptions {
  type: DataType.Integer;
}

export enum DataType {
  Float = 'Float',
  Integer = 'Integer ',
}

export const ColumnMetadataKey = Symbol('Column:metadata');
export const ColumnVariableKey = Symbol('Column:variable');

export function Column(options: ColumnOptions): any {
  return function (target: any, propertyKey: string | symbol) {
    if (!Reflect.hasOwnMetadata(ColumnVariableKey, target.constructor)) {
      Reflect.defineMetadata(ColumnVariableKey, [], target.constructor);
    }
    Reflect.getOwnMetadata(ColumnVariableKey, target.constructor).push(propertyKey);
    Reflect.defineMetadata(ColumnMetadataKey, options, target, propertyKey);
  };
}
