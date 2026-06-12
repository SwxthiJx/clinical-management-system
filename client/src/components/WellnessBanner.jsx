import { HeartPulse } from 'lucide-react';

const messages = {
  patient: 'Small habits matter: move regularly, eat a varied diet, sleep consistently, and keep preventive appointments.',
  doctor: 'A healthy care team supports healthy patients. Protect time for hydration, movement, rest, and recovery.',
  admin: 'Healthy systems begin with healthy people. Encourage breaks, manageable workloads, and preventive care.'
};

export default function WellnessBanner({ role }) {
  return (
    <aside className="wellness-banner" aria-label="Healthy living reminder">
      <HeartPulse aria-hidden="true" />
      <div>
        <strong>Today&apos;s healthy reminder</strong>
        <p>{messages[role] || messages.patient}</p>
      </div>
    </aside>
  );
}
