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
  _Object,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3ManagerService {
  private s3: S3Client;
  constructor() {
    this.s3 =
      process.env.NODE_ENV === 'production'
        ? new S3Client({})
        : new S3Client({
            endpoint: process.env.AWS_ENDPOINT,
            region: 'ca-central-1',
            forcePathStyle: true,
          });
  }

  async listBucketContents(bucket: string) {
    const command = new ListObjectsV2Command({ Bucket: bucket });
    const response: ListObjectsV2CommandOutput = await this.s3.send(command);
    const { Contents } = response;
    return Contents?.map((c: _Object) => c.Key);
  }

  async getObjectString({
    Bucket,
    Key,
  }: GetObjectCommandInput): Promise<string> {
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await this.s3.send(command);

    return (await response.Body?.transformToString()) ?? '';
  }
  async getPreSignedUrl({ Bucket, Key }: GetObjectCommandInput) {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    return await getSignedUrl(this.s3, command, { expiresIn: 172800 });
  }
  async putObject({
    ...params
  }: PutObjectCommandInput): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand(params);
    return await this.s3.send(command);
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
