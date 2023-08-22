/*
https://docs.nestjs.com/providers#services
*/

import {
  GetObjectCommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3,
  _Object,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3ManagerService {
  private s3: S3;
  constructor() {
    this.s3 = new S3({
      endpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:9000',
      region: 'ca-central-1',
      forcePathStyle: true,
    });
  }

  async listBucketContents(bucket: string) {
    const response: ListObjectsV2CommandOutput = await this.s3.listObjectsV2({
      Bucket: bucket,
    });
    const { Contents } = response;
    return Contents?.map((c: _Object) => c.Key);
  }

  async getObjectString({
    Bucket,
    Key,
  }: GetObjectCommandInput): Promise<string> {
    const response = await this.s3.getObject({ Bucket, Key });
    return (await response.Body?.transformToString()) ?? '';
  }

  async putObject({
    ...params
  }: PutObjectCommandInput): Promise<PutObjectCommandOutput> {
    return await this.s3.putObject(params);
  }

  async upload({ Bucket, Key, Body, ContentType }: PutObjectCommandInput) {
    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket,
          Key,
          Body,
          ContentType,
        },
      });

      await upload.done();
    } catch (e) {
      console.log(e);
    }
  }
}
