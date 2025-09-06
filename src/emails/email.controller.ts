import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('api')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-info')
  testInfo() {
    return {
      imapUser: process.env.IMAP_USER,
      subjectToken: process.env.TEST_SUBJECT_TOKEN,
    };
  }

  @Get('emails')
  async list() {
    return this.emailService.findAll();
  }

  @Get('emails/:id')
  async one(@Param('id') id: string) {
    return this.emailService.findOne(id);
  }
}
