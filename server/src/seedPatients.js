import './config/env.js';
import { buildDemoPatients } from './data/demoPatients.js';
import { User } from './models/User.js';
import { connectDB } from './utils/db.js';

async function seedPatients() {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const patient of buildDemoPatients()) {
    const exists = await User.exists({
      $or: [{ email: patient.email }, { username: patient.username }]
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await User.create(patient);
    created += 1;
  }

  console.log(`Patient seed complete: ${created} created, ${skipped} already existed`);
  process.exit(0);
}

seedPatients().catch((error) => {
  console.error(error);
  process.exit(1);
});
