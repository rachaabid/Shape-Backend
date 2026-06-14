import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorAppointment extends Document {
  mentor:       mongoose.Types.ObjectId;
  intern?:      mongoose.Types.ObjectId;
  title:        string;
  subtitle?:    string;
  date:         string;
  startTime:    string;
  endTime:      string;
  shaperName?:  string;
  meetingLink?: string;
  deleted?:     boolean;
}

const MentorAppointmentSchema = new Schema<IMentorAppointment>({
  mentor:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  intern:      { type: Schema.Types.ObjectId, ref: 'User' },
  title:       { type: String, required: true },
  subtitle:    String,
  date:        { type: String, required: true },
  startTime:   { type: String, required: true },
  endTime:     { type: String, required: true },
  shaperName:  String,
  meetingLink: String,
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IMentorAppointment>('MentorAppointment', MentorAppointmentSchema);
