import { HttpException, Inject, Injectable } from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

@Injectable()
export class UploadService {
  constructor(
    @Inject(S3ManagerService) private readonly s3Manager: S3ManagerService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(UploadService.name);
  }
  /**
   * upload a file to S3
   * @param filename
   * @param filePath
   * @param contentType
   * @param body
   * @returns
   */
  public async saveS3(
    filename: string,
    filePath: string,
    contentType: string,
    body: Buffer
  ): Promise<unknown> {
    this.appLogger.log('Saving to S3 Bucket');

    try {
      const res = await this.s3Manager.upload({
        Key: `${filePath}/${filename}`,
        Bucket: `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
        Body: body,
        ContentType: contentType,
      });
      return { status: res.$metadata.httpStatusCode };
    } catch (error) {
      this.appLogger.error(error);
      throw new HttpException('Error uploading file to S3', 500);
    }
  }
}
