import { TDI17Header } from './TDI17Header';
import { TDI17Details } from './TDI17Details';
import { TDI17Trailer } from './TDI17Trailer';
import { Resource, ResourceBase } from '../../common/fixedWidthRecord/Resource';

export interface ITDI17Record extends ResourceBase<ITDI17Record> {
  header: TDI17Header;
  details: TDI17Details[];
  trailer: TDI17Trailer;
}

export class TDI17Record extends Resource<ITDI17Record> implements ITDI17Record {
  public static readonly resourceType = 'TDI17Record';

  constructor(init?: any) {
    super(init);
  }

  public get header(): TDI17Header {
    return new TDI17Header(this.resource.header);
  }

  public set header(data) {
    this.resource.header = data;
  }

  public get details(): TDI17Details[] {
    const headerDetails = this.resource.details.map((jv: any) => {
      return new TDI17Details(jv);
    });
    return headerDetails;
  }

  public set details(data) {
    this.resource.details = data;
  }

  public get trailer() {
    return new TDI17Trailer(this.resource.trailer);
  }

  public set trailer(data) {
    this.resource.trailer = data;
  }
}
