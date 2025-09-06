import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

@Schema({ timestamps: true })
export class Email {
  @Prop() subject: string;
  @Prop() from: string;
  @Prop([String]) to: string[];
  @Prop({ type: Buffer }) rawSource: Buffer;
  @Prop({ type: Object }) rawHeaders: Record<string, any>;
  @Prop({ type: [{ 
    from: String, by: String, with: String, id: String, for: String, date: String, ip: String, raw: String
  }]})
  receivingChain: any[];
  @Prop({ type: Object }) esp: { provider?: string; confidence?: string; reasons?: string[] };
  @Prop() processedAt: Date;
  @Prop() receivedAt: Date;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
