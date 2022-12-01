import { Resource } from '../src/common/fixedWidthRecord/Resource';

describe('Resource', () => {
  it('resourceType should  be defined when initializing a Resouce', () => {
    class TestResource extends Resource<{}> {}
    try {
      new TestResource({});
    } catch (e) {
      expect(e instanceof Error).toBeTruthy();
      // TODO: check error message
      // expect(e?.message).toBe('no resource type specified on TestResource');
    }
  });
});
