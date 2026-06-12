import mongoose from 'mongoose';

const scheduleExceptionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

scheduleExceptionSchema.index({ doctor: 1, date: 1 }, { unique: true });

export const ScheduleException = mongoose.model('ScheduleException', scheduleExceptionSchema);
