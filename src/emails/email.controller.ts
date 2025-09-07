import { Controller, Get, Param, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { Email } from './email.schema';

interface TestInfoResponse {
  imapUser: string | undefined;
  subjectToken: string | undefined;
}

@Controller('api')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-info')
  testInfo(): TestInfoResponse {
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

  @Post('manual')
  async analyzeRawHeader(@Body('rawHeader') rawHeader: string): Promise<Email> {
    try {
      if (!rawHeader || typeof rawHeader !== 'string') {
        throw new HttpException('Raw header is required and must be a string', HttpStatus.BAD_REQUEST);
      }
      
      return await this.emailService.processRawHeader(rawHeader);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process raw header',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
