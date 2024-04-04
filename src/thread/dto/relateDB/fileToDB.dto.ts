import { OmitType } from '@nestjs/swagger'
import { FileCreateDto } from '../fileCreate.dto'

export class FileToDB extends OmitType(FileCreateDto, ['buffer']) {
  threadId?: string
}
