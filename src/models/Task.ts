import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modèle unifié `Task` : fusionne les anciennes entités
 *   Task + TaskResponse + TaskResponseComment
 * en une seule collection, via des sous-documents imbriqués :
 *   Task.responses[]            (ex-TaskResponse, une par candidat/inscription)
 *   Task.responses[].comments[] (ex-TaskResponseComment, fil de commentaires)
 */

// ── Commentaire (ex-TaskResponseComment) ───────────────────────────────────
export interface ITaskComment {
  _id?:     mongoose.Types.ObjectId;
  owner?:   mongoose.Types.ObjectId;
  user?:    mongoose.Types.ObjectId;
  message?: string;
  deleted?: boolean;
  createdAt?: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>({
  owner:   { type: Schema.Types.ObjectId, ref: 'User' },
  user:    { type: Schema.Types.ObjectId, ref: 'User' },
  message: String,
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

// ── Réponse (ex-TaskResponse) ──────────────────────────────────────────────
// status: 0=Open 1=InProgress 2=Review 3=Closed
export interface ITaskResponse {
  _id?:         mongoose.Types.ObjectId;
  owner?:       mongoose.Types.ObjectId;
  inscription?: mongoose.Types.ObjectId;
  status?:      number;
  files?:       { name: string; url: string }[];
  comments?:    ITaskComment[];
  deleted?:     boolean;
  createdAt?:   Date;
}

const TaskResponseSchema = new Schema<ITaskResponse>({
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },
  inscription: { type: Schema.Types.ObjectId, ref: 'Inscription' },
  status:      { type: Number, default: 0 },
  files:       [{ name: String, url: String }],
  comments:    [TaskCommentSchema],
  deleted:     { type: Boolean, default: false },
}, { timestamps: true });

// ── Tâche (énoncé) + réponses imbriquées ───────────────────────────────────
export interface ITask extends Document {
  title?:           { fr?: string; en?: string; ar?: string };
  description?:     { fr?: string; en?: string; ar?: string };
  keyWords?:        string[];
  online?:          boolean;
  deadLineInHours?: number;
  documents?:       { name: string; url: string }[];
  createdBy?:       mongoose.Types.ObjectId;
  training?:        mongoose.Types.ObjectId;
  responses?:       ITaskResponse[];
  deleted?:         boolean;
}

const TaskSchema = new Schema<ITask>({
  title:           { fr: String, en: String, ar: String },
  description:     { fr: String, en: String, ar: String },
  keyWords:        [String],
  online:          Boolean,
  deadLineInHours: Number,
  documents:       [{ name: String, url: String }],
  createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  training:        { type: Schema.Types.ObjectId, ref: 'Training' },
  responses:       [TaskResponseSchema],
  deleted:         { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITask>('Task', TaskSchema);
