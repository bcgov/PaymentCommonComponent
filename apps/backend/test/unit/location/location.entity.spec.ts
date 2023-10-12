import { LocationEntity } from '../../../src/location/entities/location.entity';

test('Location Entity Instance', () => {
  const location: LocationEntity = {
    id: '50d4b3f7-1bc8-4329-9dfc-18dc77b05a8c',
    source_id: 'SBC',
    location_id: 61,
    description: '100 MILE HOUSE AMEX POS',
    program_code: 0,
    program_desc: 'SERVICE BC AMEX POS',
    ministry_client: 0,
    resp_code: '32H61',
    service_line_code: 0,
    stob_code: 0,
    project_code: 0,
    merchant_ids: [],
    pt_location_ids: [],
  };

  expect(location).toBeInstanceOf(LocationEntity);
});
