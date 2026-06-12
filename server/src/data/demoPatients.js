export const demoPatients = [
  {
    name: 'Alex Patient',
    username: 'alex-patient',
    email: 'patient@clinic.local',
    password: 'Patient123!',
    phone: '555-0199'
  },
  {
    name: 'Priya Nair',
    username: 'priya-nair',
    email: 'priya@clinic.local',
    password: 'Patient123!',
    phone: '555-0201'
  },
  {
    name: 'Rahul Verma',
    username: 'rahul-verma',
    email: 'rahul@clinic.local',
    password: 'Patient123!',
    phone: '555-0202'
  },
  {
    name: 'Ananya Sharma',
    username: 'ananya-sharma',
    email: 'ananya@clinic.local',
    password: 'Patient123!',
    phone: '555-0203'
  },
  {
    name: 'Vikram Patel',
    username: 'vikram-patel',
    email: 'vikram@clinic.local',
    password: 'Patient123!',
    phone: '555-0204'
  },
  {
    name: 'Meera Joseph',
    username: 'meera-joseph',
    email: 'meera@clinic.local',
    password: 'Patient123!',
    phone: '555-0205'
  }
];

export function buildDemoPatients() {
  return demoPatients.map((patient) => ({
    ...patient,
    role: 'patient',
    emailVerifiedAt: new Date(),
    approvedAt: new Date()
  }));
}
