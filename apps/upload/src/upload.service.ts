import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}
  private readonly s3Client = new S3Client({
    region: this.config.get('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    },
  });

  async upload(fileName: string, file: Buffer) {
    console.log('uploading', fileName);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
        Key: fileName,
        Body: file,
        ACL: 'public-read',
      }),
    );
  }

  async uploadMultiple(files: { fileName: string; file: Buffer }[]) {
    await Promise.all(
      files.map(({ fileName, file }) => this.upload(fileName, file)),
    );
  }

  async update(fileName: string, file: Buffer, oldFileName: string) {
    await this.delete(oldFileName);
    await this.upload(fileName, file);
  }

  async delete(fileName: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
      }),
    );
  }

  async deleteMultiple(fileNames: string[]) {
    await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: fileNames.map((fileName) => ({ Key: fileName })),
        },
      }),
    );
  }
}
