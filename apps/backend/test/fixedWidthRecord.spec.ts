import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../src/common/fixedWidthRecord/fixedWidthRecord';

describe('FixedWidthRecord', () => {
  it('delimiter options should  be defined when initializing a FixedWidthRecord', () => {
    class TestResource extends FixedWidthRecord<IFixedWidthRecord<{}>> {
      public static readonly resourceType = 'BatchTrailer';
    }
    try {
      new TestResource({});
    } catch (e: any) {
      expect(e instanceof Error).toBeTruthy();
      expect(e?.message).toBe(
        'no delimiter options specified for TestResource'
      );
    }
  });
});
