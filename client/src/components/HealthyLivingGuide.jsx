import { Apple, Droplets, Footprints, Moon } from 'lucide-react';

const habits = [
  {
    icon: Footprints,
    title: 'Keep moving',
    message: 'Break up long periods of sitting and choose movement you can enjoy consistently.'
  },
  {
    icon: Apple,
    title: 'Eat with variety',
    message: 'Build meals around vegetables, fruit, whole grains, and suitable protein sources.'
  },
  {
    icon: Droplets,
    title: 'Stay hydrated',
    message: 'Drink water regularly and adjust for your activity, climate, and clinician guidance.'
  },
  {
    icon: Moon,
    title: 'Protect your sleep',
    message: 'Keep a steady sleep routine and give your mind time to wind down each evening.'
  }
];

export default function HealthyLivingGuide() {
  return (
    <section className="healthy-living" aria-labelledby="healthy-living-title">
      <div className="healthy-living-heading">
        <div>
          <span className="eyebrow">Everyday wellbeing</span>
          <h2 id="healthy-living-title">A healthier life, one routine at a time</h2>
        </div>
        <p>General wellness guidance. Follow your doctor&apos;s advice for your individual health needs.</p>
      </div>
      <div className="habit-grid">
        {habits.map(({ icon: Icon, title, message }) => (
          <article className="habit-item" key={title}>
            <Icon aria-hidden="true" />
            <div>
              <h3>{title}</h3>
              <p>{message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
