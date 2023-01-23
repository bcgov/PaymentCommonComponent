import { ViewEntity, ViewColumn } from 'typeorm';
import { Transform } from 'class-transformer';

{
  /*
   * Materialized Location View
   */
}

@ViewEntity({
  materialized: true,
  name: 'location_view',
  database: 'bcpcc',
  schema: 'public',
  expression: `SELECT id, "GARMS Location", "Merchant ID", "Location", "description", "Type"  FROM master_location_data
  with data;`
})
export class LocationView {
  @ViewColumn({ name: 'id' })
  id: string;

  @ViewColumn({ name: 'Type' })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  type: string;

  @ViewColumn({ name: 'Merchant ID' })
  merchant_id: number;

  @ViewColumn({ name: 'Location' })
  pt_location_id: number;

  @ViewColumn({ name: 'GARMS Location' })
  sbc_location_id: number;

  @ViewColumn({ name: 'description' })
  office_name: string;
}
