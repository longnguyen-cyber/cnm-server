export class ResThreadDto {
  success: boolean
  message: string
  errors: string
  data?: {
    id?: string
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
    isEdited?: boolean
    receiveId?: string
    senderId?: string
    chatId?: string
    channelId?: string

    messages?: {
      id: string
      message: string
      createdAt: Date
      updatedAt: Date
      threadId?: string
    }[]
    user?: {
      id: string
      name: string
      password: string
      displayName: string
      status: string
      phone: string
      email: string
      avatar: string
      createdAt: Date
      updatedAt: Date
      deletedAt: Date
    }[]
    files?: {
      id: string
      createdAt: Date
      updatedAt: Date
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      destination: string
      filename: string
      path: string
      size: number
    }[]
    emojis?: {
      id: string
      emoji: string
      createdAt: Date
      updatedAt: Date
      user?: {
        id: string
        username: string
        email: string
        avatar: string
        createdAt: Date
        updatedAt: Date
      }
    }[]
  }[]
}
