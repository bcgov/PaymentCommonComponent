/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import {
  ColumnMetadataKey,
  ColumnOptions,
  ColumnVariableKey,
  DataType,
} from './fixedWidthRecord.decorator';

type DelimiterOptions = {
  value: string; //'\x1D\r'
  positions: number[];
  length: number;
};

export interface FixedWidthOptions {
  delimiter?: DelimiterOptions;
}

@Injectable()
export class FixedWidthRecordService {
  private delimiter?: DelimiterOptions;
  constructor(options?: FixedWidthOptions) {
    if (options && options.delimiter) {
      this.delimiter = options.delimiter;
    }
  }

  convertToJson(line: string): void {
    FixedWidthRecordService.convertToJson(line, this);
  }

  convertFromJson(): Buffer {
    return FixedWidthRecordService.convertFromJSON(this);
  }

  static convertToJson<T extends Record<string, any>>(
    line: string,
    target: T,
  ): T {
    const fields = this.getAllFields(target.constructor);
    for (const field of fields) {
      const options: ColumnOptions = Reflect.getMetadata(
        ColumnMetadataKey,
        target,
        field,
      );
      const value = line
        .substring(options.start, options.start + options.width)
        .trim();
      (target as any)[field] = value;
      if (options.format) {
        if (options.format.type === DataType.Integer) {
          (target as any)[field] = parseInt(value);
        } else if (options.format.type === DataType.Float) {
          (target as any)[field] = Number(
            parseFloat(value).toFixed(options.format.precision || 2),
          );
        }
      }
    }
    return target;
  }

  /**
   * @param clz the class/constructor
   * @returns the fields decorated with @Column all the way up the prototype chain.
   */
  static getAllFields(clz: Record<string, any>): string[] {
    if (!clz) return [];
    const fields: string[] | undefined = Reflect.getMetadata(
      ColumnVariableKey,
      clz,
    );
    // get `__proto__` and (recursively) all parent classes
    const rs = new Set([
      ...(fields || []),
      ...this.getAllFields(Object.getPrototypeOf(clz)),
    ]);
    return Array.from(rs);
  }

  static convertFromJSON<T extends Record<string, any>>(target: T): Buffer {
    const fields = this.getAllFields(target.constructor);
    const fieldsWithMeta = fields.map((field) => {
      const options: ColumnOptions = Reflect.getMetadata(
        ColumnMetadataKey,
        target,
        field,
      );
      return {
        field,
        options,
      };
    });
    fieldsWithMeta.sort((a, b) => {
      return (
        a.options.start && b.options.start && a.options.start - b.options.start
      );
    });

    let op = fieldsWithMeta
      .map((field) => {
        return target[field.field].toString().padEnd(field.options.width);
      })
      .join('');

    let result = Buffer.from(op, 'utf-8');

    if (target.delimiter?.value) {
      target.delimiter.positions.forEach((pos: number) => {
        result = Buffer.concat([
          result.slice(0, pos + 1),
          Buffer.from(target.delimiter?.value),
          result.slice(pos + 1),
        ]);
      });
    }
    return Buffer.concat([result, Buffer.from('\n')]);
  }
}
