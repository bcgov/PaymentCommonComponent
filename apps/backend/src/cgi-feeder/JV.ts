import { SalesDTO } from '../sales/dto/sales.dto';
import { JVDetails } from './JvDetails';
import { JVHeader } from './JvHeader';
import { Resource, ResourceBase, transformSalesEventOptions } from './Resource';

export interface IJV extends ResourceBase<IJV> {
  header: JVHeader;
  details: JVDetails[];
}

export class JV extends Resource<IJV> implements IJV {
  public static readonly resourceType = 'JV';
  public get header(): JVHeader {
    return new JVHeader(this.resource.header);
  }

  public get details() {
    return this.resource.details.map((distribution) => {
      return new JVDetails(distribution);
    });
  }

  public static transformSalesEvent(record: SalesDTO) {
    return new JV({
      header: JVHeader.transformSalesEvent(record),
      details: record.distributions.map((distribution) =>
        JVDetails.transformSalesEvent(distribution, {
          journalName: record.journal_name,
        }),
      ),
    });
  }
}
