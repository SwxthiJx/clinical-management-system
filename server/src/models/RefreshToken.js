import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    family: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedByHash: {
      type: String,
      default: null
    },
    createdByIp: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
