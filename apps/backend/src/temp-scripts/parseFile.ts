import { handler } from '../lambdas/parseFlatFile';

export const formatFilePath = (filepath: any) => {
  filepath = filepath?.split('.').shift();
  filepath = filepath.split('/').pop();
  filepath = filepath.split('.').shift();
  return filepath;
};

export const parseTDI17 = async (filepath: any) =>
  handler({
    type: 'TDI17',
    filepath: filepath,
    outputPath: `TDI17/JSON/${formatFilePath(filepath)}.json`
  });

export const parseTDI34 = async (filepath: any) =>
  handler({
    type: 'TDI34',
    filepath: filepath,
    outputPath: `TDI34/JSON/${formatFilePath(filepath)}.json`
  });
