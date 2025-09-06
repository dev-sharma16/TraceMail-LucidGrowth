import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailService } from '../emails/email.service';
import { parseReceivedHeaders, detectESP } from '../utils/email-parse';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImapService.name);
  private client: ImapFlow;
  private running = true;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting IMAP worker...');
    this.client = new ImapFlow({
    host: this.configService.get<string>('IMAP_HOST', 'localhost'),
    port: Number(this.configService.get<string>('IMAP_PORT', '993')),
    secure: this.configService.get<string>('IMAP_SECURE', 'true') === 'true',
    auth: {
      user: this.configService.get<string>('IMAP_USER', ''),
      pass: this.configService.get<string>('IMAP_PASS', ''),
    },
  });

    try {
      await this.client.connect();
      await this.client.mailboxOpen('INBOX');
      this.logger.log('Connected to IMAP INBOX');

      this.pollLoop().catch(err => this.logger.error('Poll loop error', err));
    } catch (err) {
      this.logger.error('IMAP connect error', err);
    }
  }

  private async pollLoop() {
    const token = process.env.TEST_SUBJECT_TOKEN || '[TEST]';
    while (this.running) {
      try {
        const uids = await this.client.search({ seen: false, header: ['subject', token] });
        if (uids && uids.length) {
          for (const uid of uids) {
            try {
              const msg = await this.client.fetchOne(uid, { source: true });
              const parsed = await simpleParser(msg.source);
              // gather Received headers
              const receivedLines = parsed.headerLines
                .filter(h => h.key.toLowerCase() === 'received')
                .map(h => h.line);
              const receivingChain = parseReceivedHeaders(receivedLines);
              const esp = detectESP(parsed.headerMap, receivingChain, parsed.from?.value?.[0]?.address);
              await this.emailService.create({
                subject: parsed.subject,
                from: parsed.from?.text,
                to: parsed.to?.value?.map(v => v.address),
                rawSource: msg.source,
                rawHeaders: Object.fromEntries(parsed.headerMap),
                receivingChain,
                esp,
                processedAt: new Date(),
                receivedAt: parsed.date || new Date(),
              });
              // mark as seen
              await this.client.messageFlagsAdd(uid, ['\\Seen']);
              this.logger.log(`Processed and saved message uid=${uid}`);
            } catch (err) {
              this.logger.error('Error processing uid', err);
            }
          }
        }
      } catch (err) {
        this.logger.error('IMAP polling error', err);
      }
      // wait 8-12 seconds (simple backoff)
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  async onModuleDestroy() {
    this.running = false;
    try {
      await this.client.logout();
      this.logger.log('IMAP client logged out');
    } catch (err) {
      this.logger.error('Error logging out IMAP', err);
    }
  }
}
