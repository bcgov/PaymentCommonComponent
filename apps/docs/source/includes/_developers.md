# Developers

## 2.1 Installation/Running The Project

Please see the Readme.md

## 2.2 Code Walkthrough

### Generate GL Lambda

> Code samples

```typescript
generateGL.ts;

export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const s3manager = app.get(S3ManagerService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });

  try {
    appLogger.log('...start GL Generation');
    const contents = await s3manager.getContents(
      process.env.S3_LOCATION || 'bc-pcc-data-files-local',
      'aggregate/gl.json',
    );
    const json = contents.Body?.toString() || '';
    const glRecord = JSON.parse(json) as GLRecord;

    const output = generateGL(glRecord);
    await s3manager.putObject( process.env.S3_LOCATION || 'bc-pcc-data-files-local', 'outputs/cgigl', output);
  } catch (e) {
    appLogger.error(e);
  }
  appLogger.log('...end GL Generation');
};

const generateGL = (glRecord: GLRecord) => {
  return convertToFixedWidth(new GLRecord(glRecord));
};

const convertToFixedWidth = (glRecord: GLRecord) => {
  const BH = glRecord.batchHeader.convertFromJson();
  const BT = glRecord.trailer.convertFromJson();

  let result = Buffer.concat([BH]);
  glRecord.jv.forEach((key) => {
    result = Buffer.concat([
      result,
      key.header?.convertFromJson() || Buffer.from(''),
    ]);
    key.details?.forEach((key1) => {
      result = Buffer.concat([
        result,
        key1?.convertFromJson() || Buffer.from(''),
      ]);
    });
  });
  return Buffer.concat([result, BT]);
};

handler();

```

>

