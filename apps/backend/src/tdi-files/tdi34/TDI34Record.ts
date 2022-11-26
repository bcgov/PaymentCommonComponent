import { TDI34Header } from './TDI34Header';
import { TDI34Details } from './TDI34Details';
import { TDI34Trailer } from './TDI34Trailer';
import { Resource, ResourceBase } from '../../common/fixedWidthRecord/Resource';

export interface ITDI34Record extends ResourceBase<ITDI34Record> {
  header: TDI34Header;
  details: TDI34Details[];
  trailer: TDI34Trailer;
}

export class TDI34Record extends Resource<ITDI34Record> implements ITDI34Record {
  public static readonly resourceType = 'TDI34Record';

  constructor(init?: any) {
    super(init);
  }

  public get header(): TDI34Header {
    return new TDI34Header(this.resource.header);
  }

  public set header(data) {
    this.resource.header = data;
  }

  public get details(): TDI34Details[] {
    const headerDetails = this.resource.details.map((jv: any) => {
      return new TDI34Details(jv);
    });
    return headerDetails;
  }

  public set details(data) {
    this.resource.details = data;
  }

  public get trailer() {
    return new TDI34Trailer(this.resource.trailer);
  }

  public set trailer(data) {
    this.resource.trailer = data;
  }
}
