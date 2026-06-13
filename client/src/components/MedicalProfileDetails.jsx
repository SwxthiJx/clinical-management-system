import { AlertTriangle, HeartPulse, Phone, Pill, ShieldPlus, X } from 'lucide-react';

function MedicalList({ icon: Icon, label, items }) {
  return (
    <div className="medical-detail">
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        {items?.length ? (
          <div className="medical-tags">
            {items.map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : (
          <p>None recorded</p>
        )}
      </div>
    </div>
  );
}

export default function MedicalProfileDetails({ patient, profile, onClose }) {
  return (
    <section className="medical-profile-panel" aria-labelledby="medical-profile-title">
      <div className="medical-profile-heading">
        <div>
          <span className="eyebrow">Confidential patient information</span>
          <h3 id="medical-profile-title">{patient?.name || 'Patient'} medical profile</h3>
          <p>Use this information only for authorized clinical care.</p>
        </div>
        {onClose && (
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close medical profile">
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      {!profile ? (
        <div className="consultation-empty">
          <HeartPulse aria-hidden="true" />
          <div>
            <strong>No medical profile has been completed</strong>
            <p>The patient can add allergies, conditions, medications, and emergency details from their Medical profile page.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="medical-summary">
            <div><span>Age</span><strong>{profile.age ?? 'Not recorded'}</strong></div>
            <div><span>Blood group</span><strong>{profile.bloodGroup || 'Not recorded'}</strong></div>
          </div>
          <div className="medical-details-grid">
            <MedicalList icon={AlertTriangle} label="Allergies" items={profile.allergies} />
            <MedicalList icon={ShieldPlus} label="Medical conditions" items={profile.conditions} />
            <MedicalList icon={Pill} label="Current medications" items={profile.medications} />
            <div className="medical-detail">
              <Phone aria-hidden="true" />
              <div>
                <span>Emergency contact</span>
                {profile.emergencyContact?.name ? (
                  <p>
                    <strong>{profile.emergencyContact.name}</strong><br />
                    {profile.emergencyContact.relationship || 'Relationship not recorded'}<br />
                    {profile.emergencyContact.phone || 'Phone not recorded'}
                  </p>
                ) : (
                  <p>Not recorded</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
