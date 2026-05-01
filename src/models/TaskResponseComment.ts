import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskResponseComment extends Document {
  owner?:        mongoose.Types.ObjectId;
  message?:      string;
  user?:         mongoose.Types.ObjectId;
  taskResponse?: mongoose.Types.ObjectId;
  deleted?:      boolean;
}

const TaskResponseCommentSchema = new Schema<ITaskResponseComment>({
  owner:        { type: Schema.Types.ObjectId, ref: 'User' },
  message:      String,
  user:         { type: Schema.Types.ObjectId, ref: 'User' },
  taskResponse: { type: Schema.Types.ObjectId, ref: 'TaskResponse' },
  deleted:      { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITaskResponseComment>('TaskResponseComment', TaskResponseCommentSchema);
