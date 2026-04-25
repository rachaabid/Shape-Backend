import mongoose, { Schema, Document } from 'mongoose';

export type MessageType = 'text' | 'image' | 'document' | 'other';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender:         mongoose.Types.ObjectId;
  content:        string;
  type:           MessageType;
  fileUrl?:       string;
  fileName?:      string;
  read:           boolean;
  createdAt:      Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender:         { type: Schema.Types.ObjectId, ref: 'User',         required: true },
  content:        { type: String, required: true },
  type:           { type: String, enum: ['text', 'image', 'document', 'other'], default: 'text' },
  fileUrl:        { type: String },
  fileName:       { type: String },
  read:           { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
