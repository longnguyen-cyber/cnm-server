import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectAclCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonService } from '../common/common.service'

interface File {
  fileName: string
  size: number
  lastModified: any
}

@Injectable()
export class UploadService {
  constructor(
    private readonly config: ConfigService,
    private readonly commonService: CommonService,
  ) {}
  private readonly s3Client = new S3Client({
    region: this.config.get('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    },
  })

  async getAllUpload() {
    const files: File[] = []
    const data = await this.s3Client.send(
      new ListObjectsCommand({
        Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
      }),
    )

    data.Contents?.forEach((file) => {
      files.push({
        fileName: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
      })
    })
  }

  async getFileByKeyFileName(fileName: string): Promise<File> {
    const params = {
      Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
      Key: fileName,
    }

    try {
      const data = await this.s3Client.send(new GetObjectCommand(params))
      const file = {
        fileName: fileName,
        size: data.ContentLength,
        lastModified: data.LastModified,
      }
      return file
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async upload(fileName: string, file: Buffer) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
        Key: fileName,
        Body: file,
        ACL: 'public-read',
      }),
    )
    return this.commonService.pathUpload(fileName)
  }

  async update(fileName: string, file: Buffer, oldFileName: string) {
    await this.delete(oldFileName)
    await this.upload(fileName, file)
  }

  async updateMultiple(files: { fileName: string; file: Buffer }[]) {
    await Promise.all(
      files.map(({ fileName, file }) => this.update(fileName, file, fileName)),
    )
  }

  async delete(fileName: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
        Key: fileName,
      }),
    )
  }

  async deleteMultiple(fileNames: string[]) {
    await this.s3Client.send(
      new DeleteObjectsCommand({
        Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
        Delete: {
          Objects: fileNames.map((fileName) => ({ Key: fileName })),
        },
      }),
    )
  }
}
