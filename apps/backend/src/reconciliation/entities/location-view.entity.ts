import { ViewEntity, ViewColumn } from 'typeorm';

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
  expression: `SELECT 'GARMS Location' as sbc_location_id, 'Merchant ID' AS merchant_id, 'Location' AS pt_location_id, 'description' AS office_name, 'Type' AS type FROM master_location_data`
})
export class LocationView {
  @ViewColumn()
  type: string;

  @ViewColumn()
  merchant_id: number;

  @ViewColumn()
  pt_location_id: number;

  @ViewColumn()
  sbc_location_id: number;

  @ViewColumn()
  office_name: string;
}
