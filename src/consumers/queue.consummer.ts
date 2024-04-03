import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { MailerService } from '@nest-modules/mailer'
import { Logger } from '@nestjs/common'

@Processor('queue')
export class EmailConsumer {
  constructor(private mailerService: MailerService) {}
  private readonly logger = new Logger(EmailConsumer.name)
  @Process('register')
  async registerEmail(job: Job<unknown>) {
    const time1 = new Date()
    await this.mailerService.sendMail({
      to: job.data['to'],
      subject: 'Welcome to my website',
      template: './verify_account',
      context: {
        name: job.data['name'],
        link: job.data['link'],
      },
    })
    const time2 = new Date()
    console.log('Send Success: ', time2.getTime() - time1.getTime(), 'ms')
  }

  @Process('forgot-password')
  async forgotPassword(job: Job<unknown>) {
    const time1 = new Date()
    await this.mailerService.sendMail({
      to: job.data['to'],
      subject: 'Reset password',
      template: './forgot_password',
      context: {
        name: job.data['name'],
        link: job.data['link'],
      },
    })
    const time2 = new Date()
    console.log('Send Success: ', time2.getTime() - time1.getTime(), 'ms')
  }

  @Process('send-thread')
  async sendThread(job: Job<unknown>) {
    const time1 = new Date()
    this.logger.log(`add send thread: ${job.data}`)
    const time2 = new Date()
    console.log('add success: ', time2.getTime() - time1.getTime(), 'ms')
  }
  @Process('delete-thread')
  async deleteThread(job: Job<unknown>) {
    const time1 = new Date()
    this.logger.log(`add delete: ${job.data}`)
    const time2 = new Date()
    console.log('add delete success: ', time2.getTime() - time1.getTime(), 'ms')
  }
  @Process('recall-thread')
  async recallThread(job: Job<unknown>) {
    const time1 = new Date()
    this.logger.log(`add recall: ${job.data}`)
    const time2 = new Date()
    console.log('add recall success: ', time2.getTime() - time1.getTime(), 'ms')
  }
}
