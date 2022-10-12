/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { InjectAwsService } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3ManagerService {
  constructor(@InjectAwsService(S3) private readonly s3: S3) {}

  async listBucketContents(bucket: string) {
    const response = await this.s3.listObjectsV2({ Bucket: bucket }).promise();
    
    return response.Contents?.map((c) => c.Key);
  }

  async getContents(bucket: string, key: string){
    const response = await this.s3.getObject({Bucket: bucket, Key: key}).promise();
    return response
  }

  async putObject(bucket: string, key: string, body: string| Buffer){
    const response = await this.s3.putObject({Bucket: bucket, Key: key, Body: body}).promise();
    return response
  }

}
