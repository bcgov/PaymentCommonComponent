import { validateSbcGarmsFileName } from '../../../src/lambdas/helpers';

describe('Tests the filename regex validation', () => {
  it('Verifies that the regex for checking SBC filenames will not return a false negative', () => {
    const validTestFileNames = [
      'sbc/SBC_SALES_2024_01_01_01_17_09.JSON',
      'sbc/SBC_SALES_2025_02_02_00_17_21.JSON',
      'sbc/SBC_SALES_2026_03_03_23_17_37.JSON',
      'sbc/SBC_SALES_2030_04_06_23_18_08.JSON',
      'sbc/SBC_SALES_2040_05_07_23_18_56.JSON',
      'sbc/SBC_SALES_2031_06_08_23_16_34.JSON',
      'sbc/SBC_SALES_2023_07_13_23_16_51.JSON',
      'sbc/SBC_SALES_2023_08_10_23_19_15.JSON',
      'sbc/SBC_SALES_2023_09_21_23_17_21.JSON',
      'sbc/SBC_SALES_2023_10_20_23_17_39.JSON',
      'sbc/SBC_SALES_2023_11_30_23_17_56.JSON',
      'sbc/SBC_SALES_2023_12_31_23_17_56.JSON',
    ];

    expect(
      validTestFileNames.every((name) => validateSbcGarmsFileName(name))
    ).toStrictEqual(true);
  });

  it('Verifies that the regex for checking SBC filenames will not return a false positive', () => {
    const invalidTestFileNames = [
      'sbc/SBCSALES2023_02_17_23_18_53.JSON',
      'sbc/SBC_SALES_1999_02_21_23_17_03.JSON',
      'sbc/SBC_SALES_2023_36_22_23_17_38.JSON',
      'sbc/SBC_SALES_2023_02_17_23_16_51.JSON',
      'sbc/SBC_SALES_2023_02_24_64_16_19.JSON',
      'sbc/SBC_SALES_20230227_23_16_54.JSON',
    ];

    expect(
      invalidTestFileNames.every((name) => validateSbcGarmsFileName(name))
    ).toStrictEqual(false);
  });
});
