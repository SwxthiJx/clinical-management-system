import mongoose from 'mongoose';

const consultationNoteSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subjective: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    objective: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    assessment: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    plan: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    prescriptions: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    followUpInstructions: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    followUpDate: {
      type: Date,
      default: null
    },
    privateNotes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
      index: true
    },
    revision: {
      type: Number,
      min: 1,
      default: 1
    },
    finalizedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

consultationNoteSchema.index({ patient: 1, updatedAt: -1 });
consultationNoteSchema.index({ doctor: 1, updatedAt: -1 });

export const ConsultationNote = mongoose.model('ConsultationNote', consultationNoteSchema);
