import '../config/env.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { connectDB } from '../utils/db.js';

const usernamesByEmail = {
  'admin@clinic.local': 'clinic-admin',
  'doctor@clinic.local': 'dr-maya-rao',
  'cardio@clinic.local': 'dr-arjun-mehta',
  'derma@clinic.local': 'dr-neha-iyer',
  'peds@clinic.local': 'dr-farah-khan',
  'ortho@clinic.local': 'dr-kabir-sen',
  'ent@clinic.local': 'dr-sara-thomas',
  'patient@clinic.local': 'alex-patient'
};

async function migrate() {
  await connectDB();
  const now = new Date();
  const legacyAdmin = await User.findOne({
    email: 'admin@clinic.local',
    securityMigrationVersion: { $ne: 1 }
  }).select('+password +securityMigrationVersion');

  if (legacyAdmin) {
    legacyAdmin.password = 'Admin1234!';
    legacyAdmin.securityMigrationVersion = 1;
    await legacyAdmin.save();
  }

  await User.updateMany(
    { authVersion: { $exists: false } },
    { $set: { authVersion: 0 } }
  );
  await User.updateMany(
    { emailVerifiedAt: null },
    { $set: { emailVerifiedAt: now } }
  );
  await User.updateMany(
    { role: { $in: ['doctor', 'admin'] }, approvedAt: null },
    { $set: { approvedAt: now } }
  );
  await User.updateMany(
    { role: 'patient', approvedAt: null },
    { $set: { approvedAt: now } }
  );
  await User.updateMany(
    { securityMigrationVersion: { $ne: 1 } },
    { $set: { securityMigrationVersion: 1 } }
  );

  for (const [email, username] of Object.entries(usernamesByEmail)) {
    await User.updateOne(
      { email, $or: [{ username: { $exists: false } }, { username: null }] },
      { $set: { username } }
    );
  }

  console.log('Phase 1 security migration completed');
  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error('Phase 1 migration failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
