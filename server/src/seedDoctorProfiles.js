import './config/env.js';
import { demoDoctorProfiles } from './data/demoDoctorProfiles.js';
import { User } from './models/User.js';
import { connectDB } from './utils/db.js';

async function seedDoctorProfiles() {
  await connectDB();

  let updated = 0;
  let missing = 0;

  for (const [username, profile] of Object.entries(demoDoctorProfiles)) {
    const result = await User.updateOne(
      { username, role: 'doctor' },
      { $set: profile },
      { runValidators: true }
    );

    if (result.matchedCount) updated += 1;
    else missing += 1;
  }

  console.log(`Doctor profile seed complete: ${updated} updated, ${missing} not found`);
  process.exit(0);
}

seedDoctorProfiles().catch((error) => {
  console.error(error);
  process.exit(1);
});
