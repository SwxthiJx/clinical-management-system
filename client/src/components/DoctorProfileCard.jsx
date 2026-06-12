import { BriefcaseMedical, GraduationCap, Languages, Stethoscope } from 'lucide-react';
import { formatAvailability } from '../utils/formatters.js';

export default function DoctorProfileCard({ doctor, selected, onSelect }) {
  return (
    <article className={`doctor-profile-card${selected ? ' selected' : ''}`}>
      <div className="doctor-profile-heading">
        <div className="doctor-avatar" aria-hidden="true">
          <Stethoscope />
        </div>
        <div>
          <h3>{doctor.name}</h3>
          <span>{doctor.specialty}</span>
        </div>
        {selected && <span className="selected-label">Selected</span>}
      </div>

      <p className="doctor-bio">{doctor.bio || 'Professional profile details will be available soon.'}</p>

      <dl className="doctor-facts">
        <div>
          <GraduationCap aria-hidden="true" />
          <dt>Education</dt>
          <dd>{doctor.education?.join(' · ') || 'Not listed'}</dd>
        </div>
        <div>
          <BriefcaseMedical aria-hidden="true" />
          <dt>Experience</dt>
          <dd>{doctor.experienceYears ? `${doctor.experienceYears} years` : 'Not listed'}</dd>
        </div>
        <div>
          <Languages aria-hidden="true" />
          <dt>Languages</dt>
          <dd>{doctor.languages?.join(', ') || 'Not listed'}</dd>
        </div>
      </dl>

      {!!doctor.clinicalInterests?.length && (
        <div className="clinical-interests">
          {doctor.clinicalInterests.map((interest) => <span key={interest}>{interest}</span>)}
        </div>
      )}

      <p className="doctor-availability"><strong>Availability:</strong> {formatAvailability(doctor.availability)}</p>
      <button className={selected ? 'compact-button' : 'primary'} type="button" onClick={() => onSelect(doctor._id)}>
        {selected ? 'Selected for booking' : 'Choose doctor'}
      </button>
    </article>
  );
}
