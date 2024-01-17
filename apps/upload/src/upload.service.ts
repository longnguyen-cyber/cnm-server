import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    },
  });

  constructor(private readonly configService: ConfigService) {}

  async upload(fileName: string, file: Buffer) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: fileName,
        Body: file,
        ACL: 'public-read',
      }),
    );
  }

  async update(fileName: string, file: Buffer, oldFileName: string) {
    await this.delete(oldFileName);
    await this.upload(fileName, file);
  }

  async delete(fileName: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: fileName,
      }),
    );
  }

  async deleteMultiple(fileNames: string[]) {
    await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Delete: {
          Objects: fileNames.map((fileName) => ({ Key: fileName })),
        },
      }),
    );
  }
}
