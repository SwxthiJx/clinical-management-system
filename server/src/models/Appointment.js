import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    status: {
      type: String,
      enum: ['booked', 'completed', 'cancelled'],
      default: 'booked'
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin', null],
      default: null
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctor: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['booked', 'completed'] } }
  }
);

appointmentSchema.index({ patient: 1, startTime: 1 });
appointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
