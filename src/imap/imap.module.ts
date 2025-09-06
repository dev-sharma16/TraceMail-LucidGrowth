import { Module } from '@nestjs/common';
import { EmailModule } from '../emails/email.module';
import { ImapService } from './imap.service';

@Module({
  imports: [EmailModule],
  providers: [ImapService],
  exports: [ImapService],
})
export class ImapModule {}
