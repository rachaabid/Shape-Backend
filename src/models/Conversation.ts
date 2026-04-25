import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants:      mongoose.Types.ObjectId[];
  lastMessage:       string;
  lastMessageAt:     Date;
  lastMessageSender: mongoose.Types.ObjectId;
  unreadCounts:      Map<string, number>;
  createdAt:         Date;
}

const ConversationSchema = new Schema<IConversation>({
  participants:      [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage:       { type: String, default: '' },
  lastMessageAt:     { type: Date,   default: Date.now },
  lastMessageSender: { type: Schema.Types.ObjectId, ref: 'User' },
  unreadCounts:      { type: Map, of: Number, default: {} },
}, { timestamps: true });

// Index pour retrouver rapidement la conversation entre deux utilisateurs
ConversationSchema.index({ participants: 1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
