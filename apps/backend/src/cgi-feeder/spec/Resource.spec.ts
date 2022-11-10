import { Resource } from '../Resource';

describe('Resource', () => {
  it('resourceType should  be defined when initializing a Resouce', () => {
    class TestResource extends Resource<{}> {}
    try {
      const object = new TestResource({});
    } catch (e) {
        expect(e instanceof Error).toBeTruthy();
        expect(e.message).toBe('no resource type specified on TestResource');
    }
  });
});
