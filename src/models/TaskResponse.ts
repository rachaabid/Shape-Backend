import mongoose, { Schema, Document } from 'mongoose';

// status: 0=Open 1=InProgress 2=Review 3=Closed
export interface ITaskResponse extends Document {
  task?:        mongoose.Types.ObjectId;
  owner?:       mongoose.Types.ObjectId;
  inscription?: mongoose.Types.ObjectId;
  status?:      number;
  files?:       { name: string; url: string }[];
  deleted?:     boolean;
}

const TaskResponseSchema = new Schema<ITaskResponse>({
  task:        { type: Schema.Types.ObjectId, ref: 'Task' },
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },
  inscription: { type: Schema.Types.ObjectId, ref: 'Inscription' },
  status:      { type: Number, default: 0 },
  files:       [{ name: String, url: String }],
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITaskResponse>('TaskResponse', TaskResponseSchema);
