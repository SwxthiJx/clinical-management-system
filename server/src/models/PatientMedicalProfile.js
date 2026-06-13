import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: 60,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    }
  },
  { _id: false }
);

const patientMedicalProfileSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
      default: null
    },
    bloodGroup: {
      type: String,
      enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: ''
    },
    allergies: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: []
    },
    conditions: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: []
    },
    medications: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: []
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({})
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export const PatientMedicalProfile = mongoose.model(
  'PatientMedicalProfile',
  patientMedicalProfileSchema
);
