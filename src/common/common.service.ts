import { Injectable } from '@nestjs/common'
import slugify from 'slugify'

const slugifyConfig = {
  remove: undefined,
  lower: true,
  strict: false,
  locale: 'vi',
  trim: true,
}
@Injectable()
export class CommonService {
  slugGenerator(str: string): string {
    return slugify(str, slugifyConfig)
  }

  isNotEmptyObject(obj: object): boolean {
    return obj && Object.keys(obj).length !== 0
  }

  filterEmptyObject(obj: object): object {
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key]) {
        acc[key] = obj[key]
      }
      return acc
    }, {})
  }

  exclude = <T, Key extends keyof T>(entity: T, keys: Key[]): Omit<T, Key> => {
    for (const key of keys) {
      delete entity[key]
    }
    return entity
  }

  transferFileToURL(req: any, image: string): string {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    return `${baseUrl}/api/${image}`
  }

  limitFileSize(bytes: number): boolean {
    const fileSize = bytes / 1024 / 1024 // MB
    if (fileSize <= 2) {
      return true
    }
    return false
  }

  convertToSize(bytes: number): string {
    const mb = bytes / 1024 / 1024
    // if mb >1024 => convert to GB
    // if gb > 1024 => convert to TB

    if (mb > 1024) {
      const gb = mb / 1024
      if (gb > 1024) {
        const tb = gb / 1024
        return `${tb.toFixed(2)} TB`
      }
      return `${gb.toFixed(2)} GB`
    } else {
      return `${mb.toFixed(2)} MB`
    }
  }

  pathUpload(fileName: string): string {
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName.replace(/ /g, '-')}`
  }

  getFileName(url: string): string {
    const arr = url.split('/')
    return arr[arr.length - 1]
  }
  deleteField(obj: any, removeFields: string[], addFields?: string[]): any {
    const fieldDefaultRemove = [
      'password',
      'createdAt',
      'channel',
      'status',
      'updatedAt',
      'deletedAt',
    ]

    if (removeFields.length === 0) {
      removeFields = fieldDefaultRemove
    } else {
      removeFields = [...removeFields, ...fieldDefaultRemove]
    }

    // If addFields is specified, remove these removeFields from the removeFields array
    if (addFields) {
      removeFields = removeFields.filter((field) => !addFields.includes(field))
    }

    for (let key in obj) {
      if (removeFields.includes(key)) {
        delete obj[key]
      } else if (typeof obj[key] === 'object') {
        this.deleteField(obj[key], removeFields, addFields)
      }
    }

    return obj
  }

  convertDateToDB(date: string): string {
    const convert = new Date(date)
    const year = convert.getFullYear()
    const month =
      convert.getMonth() + 1 < 10
        ? `0${convert.getMonth() + 1}`
        : convert.getMonth() + 1

    const day = convert.getDate()

    const formattedDate = `${year}-${month}-${day}`
    return formattedDate
  }
}
