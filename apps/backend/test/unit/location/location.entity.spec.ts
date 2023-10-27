import { LocationEntity } from '../../../src/location/entities';

test('Location Entity Instance', () => {
  const location: LocationEntity = new LocationEntity({
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
  });
  expect(location).toBeInstanceOf(LocationEntity);
});
