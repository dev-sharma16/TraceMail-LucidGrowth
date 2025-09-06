import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { EmailModule } from './emails/email.module';
import { ImapModule } from './imap/imap.module';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    EmailModule,
    ImapModule,
    ConfigModule.forRoot({ isGlobal: true })
  ],
})
export class AppModule {}
