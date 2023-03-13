import { Resource } from '../src/common/entities/Resource';
/*eslint-disable @typescript-eslint/no-explicit-any*/
describe('Resource', () => {
  it('resourceType should  be defined when initializing a Resouce', () => {
    class TestResource extends Resource<any> {}
    try {
      new TestResource({});
    } catch (e: any) {
      expect(e instanceof Error).toBeTruthy();
    }
  });
});
