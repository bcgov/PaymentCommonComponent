import { SalesDTO } from '../../sales/dto/sales.dto';

export interface ResourceBase<T> {
  resourceType?: string;
  transformSalesEvent?(
    record: SalesDTO,
    options: transformSalesEventOptions,
  ): T;
}

export type transformSalesEventOptions = {
  journalName: string;
};

export class Resource<T extends ResourceBase<T>> implements ResourceBase<T> {
  public resource: T;
  constructor(data: T) {
    if (data instanceof Resource) {
      data = data.resource;
    }
    const resourceType = (this.constructor as any).resourceType;
    if (resourceType) {
      data.resourceType = resourceType;
    } else {
      throw new Error(`no resource type specified on ${this.constructor.name}`);
    }
    this.resource = data;
  }

  public get resourceType(): T['resourceType'] {
    return this.resource.resourceType;
  }
}
