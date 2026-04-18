import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSetting extends Document {
  userId:          mongoose.Types.ObjectId;
  emailOnApply?:   boolean;
  emailOnStatus?:  boolean;
  emailOnInterview?:boolean;
  pushEnabled?:    boolean;
}

const NotificationSettingSchema = new Schema<INotificationSetting>({
  userId:            { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  emailOnApply:      { type: Boolean, default: true },
  emailOnStatus:     { type: Boolean, default: true },
  emailOnInterview:  { type: Boolean, default: true },
  pushEnabled:       { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<INotificationSetting>('NotificationSetting', NotificationSettingSchema);
