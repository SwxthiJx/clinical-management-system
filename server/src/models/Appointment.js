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
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null
    },
    notifications: {
      confirmationSentAt: {
        type: Date,
        default: null
      },
      cancellationSentAt: {
        type: Date,
        default: null
      },
      completionSentAt: {
        type: Date,
        default: null
      },
      reminderSentAt: {
        type: Date,
        default: null
      },
      reminderClaimedAt: {
        type: Date,
        default: null
      }
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
appointmentSchema.index({ status: 1, startTime: 1, 'notifications.reminderSentAt': 1 });
appointmentSchema.index(
  { patient: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } }
  }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
