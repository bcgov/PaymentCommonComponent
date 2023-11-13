import { ValidateNested } from 'class-validator';

export class ListDTO<T> {
  @ValidateNested({ each: true })
  list: T[];

  constructor(dto: T[]) {
    this.list = dto;
  }
}
