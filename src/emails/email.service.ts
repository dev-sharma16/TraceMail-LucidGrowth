import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from './email.schema';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(@InjectModel(Email.name) private emailModel: Model<EmailDocument>) {}

  async create(payload: Partial<Email>): Promise<Email> {
    const created = new this.emailModel(payload);
    return created.save();
  }

  async findAll(limit = 50) {
    return this.emailModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async findOne(id: string) {
    return this.emailModel.findById(id).lean().exec();
  }
}
