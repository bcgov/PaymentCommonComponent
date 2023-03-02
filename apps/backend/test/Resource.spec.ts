import { Resource } from '../src/common/entities/Resource';

describe('Resource', () => {
  it('resourceType should  be defined when initializing a Resouce', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class TestResource extends Resource<any> {}
    try {
      new TestResource({});
    } catch (e) {
      expect(e instanceof Error).toBeTruthy();
      expect(e.message).toBe('resourceType must be defined');
    }
  });
});
