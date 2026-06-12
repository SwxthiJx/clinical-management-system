import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const availabilityWindowSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    }
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 10,
      select: false
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient'
    },
    specialty: {
      type: String,
      trim: true,
      default: ''
    },
    education: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 70,
      default: 0
    },
    languages: {
      type: [String],
      default: []
    },
    clinicalInterests: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 600,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    availability: {
      type: [availabilityWindowSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    authVersion: {
      type: Number,
      default: 0,
      select: false
    },
    securityMigrationVersion: {
      type: Number,
      default: 1,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const object = this.toObject();
  delete object.password;
  delete object.authVersion;
  delete object.securityMigrationVersion;
  return object;
};

export const User = mongoose.model('User', userSchema);
