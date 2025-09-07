import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Email, EmailDocument } from "./email.schema";
import { simpleParser } from 'mailparser';
import { parseReceivedHeaders, detectESP } from '../utils/email-parse';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>
  ) {}

  async create(payload: Partial<Email>): Promise<Email> {
    const created = new this.emailModel(payload);
    return created.save();
  }

  async findAll(limit = 50) {
    return this.emailModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findOne(id: string) {
    return this.emailModel.findById(id).lean().exec();
  }

  async processRawHeader(rawHeader: string) {
    try {
      const parsed = await simpleParser(rawHeader);

      const receivedHeaders = parsed.headers.get('received');
      const receivedLines = (Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders])
        .filter((header): header is string => typeof header === 'string');

      const chain = parseReceivedHeaders(receivedLines);

      const fromAddress = parsed.from?.value?.[0]?.address;
      const esp = detectESP(parsed.headers, chain, fromAddress);

      const toAddresses: string[] = [];
      if (parsed.to) {
        if (Array.isArray(parsed.to)) {
          toAddresses.push(...parsed.to.map(addr => addr.text || '').filter(Boolean));
        } else {
          toAddresses.push(parsed.to.text || '');
        }
      }

      const emailDoc = new this.emailModel({
        subject: parsed.subject || "Manual Submission",
        from: parsed.from?.text || "Unknown",
        to: toAddresses,
        rawHeaders: Object.fromEntries(parsed.headers),
        receivingChain: chain,
        esp,
        processedAt: new Date(),
        receivedAt: parsed.date || new Date()
      });

      return emailDoc.save();
    } catch (error) {
      this.logger.error('Error processing raw header:', error);
      throw error;
    }
  }
}
