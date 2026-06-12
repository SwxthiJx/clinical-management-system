import mongoose from 'mongoose';

const authTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    usedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

authTokenSchema.index({ user: 1, type: 1 });

export const AuthToken = mongoose.model('AuthToken', authTokenSchema);
