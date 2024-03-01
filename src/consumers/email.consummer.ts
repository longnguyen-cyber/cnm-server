import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { MailerService } from '@nest-modules/mailer'

@Processor('send-mail')
export class EmailConsumer {
  constructor(private mailerService: MailerService) {}

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
}
