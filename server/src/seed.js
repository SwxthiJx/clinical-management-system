import './config/env.js';
import { buildDemoPatients } from './data/demoPatients.js';
import { demoDoctorProfiles } from './data/demoDoctorProfiles.js';
import { Appointment } from './models/Appointment.js';
import { AuditLog } from './models/AuditLog.js';
import { AuthToken } from './models/AuthToken.js';
import { RefreshToken } from './models/RefreshToken.js';
import { ScheduleException } from './models/ScheduleException.js';
import { User } from './models/User.js';
import { connectDB } from './utils/db.js';

async function seed() {
  await connectDB();
  await Appointment.deleteMany({});
  await AuditLog.deleteMany({});
  await AuthToken.deleteMany({});
  await RefreshToken.deleteMany({});
  await ScheduleException.deleteMany({});
  await User.deleteMany({});

  await User.create([
    {
      name: 'Clinic Admin',
      username: 'clinic-admin',
      email: 'admin@clinic.local',
      password: 'Admin1234!',
      role: 'admin',
      emailVerifiedAt: new Date(),
      approvedAt: new Date()
    },
    {
      name: 'Dr. Maya Rao',
      username: 'dr-maya-rao',
      email: 'doctor@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'General Medicine',
      ...demoDoctorProfiles['dr-maya-rao'],
      phone: '555-0101',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '15:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }
      ]
    },
    {
      name: 'Dr. Arjun Mehta',
      username: 'dr-arjun-mehta',
      email: 'cardio@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'Cardiology',
      ...demoDoctorProfiles['dr-arjun-mehta'],
      phone: '555-0102',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 2, startTime: '11:00', endTime: '16:00' },
        { dayOfWeek: 4, startTime: '09:30', endTime: '13:30' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '12:00' }
      ]
    },
    {
      name: 'Dr. Neha Iyer',
      username: 'dr-neha-iyer',
      email: 'derma@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'Dermatology',
      ...demoDoctorProfiles['dr-neha-iyer'],
      phone: '555-0103',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 5, startTime: '13:00', endTime: '17:00' }
      ]
    },
    {
      name: 'Dr. Farah Khan',
      username: 'dr-farah-khan',
      email: 'peds@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'Pediatrics',
      ...demoDoctorProfiles['dr-farah-khan'],
      phone: '555-0104',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '15:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '12:30' },
        { dayOfWeek: 6, startTime: '09:30', endTime: '13:00' }
      ]
    },
    {
      name: 'Dr. Kabir Sen',
      username: 'dr-kabir-sen',
      email: 'ortho@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'Orthopedics',
      ...demoDoctorProfiles['dr-kabir-sen'],
      phone: '555-0105',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '11:30' }
      ]
    },
    {
      name: 'Dr. Sara Thomas',
      username: 'dr-sara-thomas',
      email: 'ent@clinic.local',
      password: 'Doctor123!',
      role: 'doctor',
      specialty: 'ENT',
      ...demoDoctorProfiles['dr-sara-thomas'],
      phone: '555-0106',
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
      availability: [
        { dayOfWeek: 0, startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '19:00' }
      ]
    },
    ...buildDemoPatients()
  ]);

  console.log('Seed data created');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
