import { handler } from '../lambdas/parseFlatFile';

const formatOutput = (filepath: any) => {
  const date = filepath.split('').splice(0, 10).join('');
  filepath = filepath?.split('.').shift();
  filepath = filepath.split('/').pop();
  filepath = filepath.split('.').shift();
  return `${date}/TDI17/JSON/${filepath}.json`;
};

export const parseHandler = async (filepath: any) =>
  handler({
    type: 'TDI17',
    filepath: filepath,
    outputPath: formatOutput(filepath)
  });
