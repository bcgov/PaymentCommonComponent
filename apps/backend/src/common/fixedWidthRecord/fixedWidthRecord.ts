import { Resource, ResourceBase } from './Resource';
import {
  ColumnMetadataKey,
  ColumnOptions,
  ColumnVariableKey,
  DataType
} from './fixedWidthRecord.decorator';

type DelimiterOptions = {
  value: string; //'\x1D\r'
  positions: number[];
  length: number;
};

export interface IFixedWidthRecord<T> extends ResourceBase<T> {
  delimiter?: DelimiterOptions;
}

export class FixedWidthRecord<T extends IFixedWidthRecord<T>>
  extends Resource<T>
  implements IFixedWidthRecord<T>
{
  constructor(data: T) {
    super(data);
    if (data instanceof FixedWidthRecord) {
      data = data.resource;
    }
    const delimiter = (this.constructor as any).delimiter;
    if (delimiter) {
      data.delimiter = delimiter;
    }
  }
  public convertToJson(line: string): void {
    FixedWidthRecord.convertToJson(line, this);
  }

  public convertFromJson(): Buffer {
    return FixedWidthRecord.convertFromJSON(this);
  }

  static convertToJson<T extends Record<string, any>>(
    line: string,
    target: T
  ): T {
    const fields = this.getAllFields(target.constructor);
    for (const field of fields) {
      const options: ColumnOptions = Reflect.getMetadata(
        ColumnMetadataKey,
        target,
        field
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
            parseFloat(value).toFixed(options.format.precision || 2)
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
  private static getAllFields(clz: Record<string, any>): string[] {
    if (!clz) return [];
    const fields: string[] | undefined = Reflect.getMetadata(
      ColumnVariableKey,
      clz
    );
    // get `__proto__` and (recursively) all parent classes
    const rs = new Set([
      ...(fields || []),
      ...this.getAllFields(Object.getPrototypeOf(clz))
    ]);
    return Array.from(rs);
  }

  static convertFromJSON<T extends Record<string, any>>(target: T): Buffer {
    const fields = this.getAllFields(target.constructor);
    const fieldsWithMeta = fields.map((field) => {
      const options: ColumnOptions = Reflect.getMetadata(
        ColumnMetadataKey,
        target,
        field
      );
      return {
        field,
        options
      };
    });
    fieldsWithMeta.sort((a, b) => {
      return (
        a.options.start && b.options.start && a.options.start - b.options.start
      );
    });

    const op = fieldsWithMeta
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
          result.slice(pos + 1)
        ]);
      });
    }
    return Buffer.concat([result, Buffer.from('\n')]);
  }

  public get delimiter(): T['delimiter'] {
    return this.resource.delimiter;
  }
}
