/*
https://docs.nestjs.com/providers#services
*/

import {
  GetObjectCommand,
  GetObjectCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
  S3ClientConfig,
  _Object,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {
  getSignedUrl,
} from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3ManagerService {
  public s3: S3Client;
  constructor() {
    const config: S3ClientConfig =
      process.env.NODE_ENV === 'production'
        ? {
            endpoint: process.env.AWS_ENDPOINT,
            region: 'ca-central-1',
            forcePathStyle: true,
          }
        : {};
    this.s3 = new S3Client(config);
  }

  async listBucketContents(bucket: string) {
    const command = new ListObjectsV2Command({ Bucket: bucket });
    const response: ListObjectsV2CommandOutput = await this.s3.send(command);
    const { Contents } = response;
    return Contents?.map((c: _Object) => c.Key ?? '');
  }

  async getObjectString({
    Bucket,
    Key,
  }: GetObjectCommandInput): Promise<string> {
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await this.s3.send(command);

    return (await response.Body?.transformToString()) ?? '';
  }

  async putObject({
    ...params
  }: PutObjectCommandInput): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand(params);
    return await this.s3.send(command);
  }

  async upload({ Bucket, Key, Body, ContentType }: PutObjectCommandInput) {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket,
        Key,
        Body,
        ContentType,
      },
    });

    return await upload.done();
  }

  async generatePresignedUrl(
    { Bucket, Key }: GetObjectCommandInput,
    expiresIn: number
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    const client: S3Client = this.s3;

    return await getSignedUrl(client, command, { expiresIn });
  }
}
