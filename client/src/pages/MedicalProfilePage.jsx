import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HeartPulse, Save } from 'lucide-react';
import { api } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useClinicMutation, useMedicalProfile } from '../hooks/useClinicQueries.js';

const emptyForm = {
  age: '',
  bloodGroup: '',
  allergies: '',
  conditions: '',
  medications: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: ''
};

function listText(items = []) {
  return items.join(', ');
}

function parseList(value) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function formFromProfile(profile) {
  if (!profile) return emptyForm;
  return {
    age: profile.age ?? '',
    bloodGroup: profile.bloodGroup || '',
    allergies: listText(profile.allergies),
    conditions: listText(profile.conditions),
    medications: listText(profile.medications),
    emergencyName: profile.emergencyContact?.name || '',
    emergencyRelationship: profile.emergencyContact?.relationship || '',
    emergencyPhone: profile.emergencyContact?.phone || ''
  };
}

export default function MedicalProfilePage() {
  const { user } = useAuth();
  const profileQuery = useMedicalProfile('me');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);
  const updateProfile = useClinicMutation({
    mutationFn: (profile) =>
      api('/api/users/me/medical-profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      }),
    invalidate: [queryKeys.medicalProfile('me')]
  });

  useEffect(() => {
    if (profileQuery.data) setForm(formFromProfile(profileQuery.data.profile));
  }, [profileQuery.data]);

  if (user.role !== 'patient') return <Navigate to="/appointments" replace />;
  if (profileQuery.isLoading) return <main className="loading">Loading...</main>;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    try {
      await updateProfile.mutateAsync({
        age: form.age === '' ? null : Number(form.age),
        bloodGroup: form.bloodGroup,
        allergies: parseList(form.allergies),
        conditions: parseList(form.conditions),
        medications: parseList(form.medications),
        emergencyContact: {
          name: form.emergencyName,
          relationship: form.emergencyRelationship,
          phone: form.emergencyPhone
        }
      });
      setMessage({ type: 'success', text: 'Medical profile saved securely.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  return (
    <div className="main-column">
      <PageHeader
        eyebrow="Private health information"
        title="My medical profile"
        description="Keep these details current so authorized clinicians can provide safer care."
        icon={HeartPulse}
      />
      <section className="panel medical-profile-editor">

      {profileQuery.error && <p className="error">{profileQuery.error.message}</p>}

      <form className="grid-form" onSubmit={submit}>
        <label>
          Age
          <input
            type="number"
            min="0"
            max="130"
            value={form.age}
            onChange={(event) => update('age', event.target.value)}
          />
        </label>
        <label>
          Blood group
          <select value={form.bloodGroup} onChange={(event) => update('bloodGroup', event.target.value)}>
            <option value="">Select blood group</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>
        <label className="full">
          Allergies
          <textarea
            value={form.allergies}
            onChange={(event) => update('allergies', event.target.value)}
            placeholder="Penicillin, peanuts, latex"
          />
          <small>Separate multiple entries with commas.</small>
        </label>
        <label className="full">
          Medical conditions
          <textarea
            value={form.conditions}
            onChange={(event) => update('conditions', event.target.value)}
            placeholder="Asthma, diabetes"
          />
          <small>Separate multiple entries with commas.</small>
        </label>
        <label className="full">
          Current medications
          <textarea
            value={form.medications}
            onChange={(event) => update('medications', event.target.value)}
            placeholder="Medicine name and dosage"
          />
          <small>Separate multiple entries with commas.</small>
        </label>
        <div className="form-section-title full">
          <h3>Emergency contact</h3>
          <p>Someone the care team may contact during an emergency.</p>
        </div>
        <label>
          Contact name
          <input value={form.emergencyName} onChange={(event) => update('emergencyName', event.target.value)} />
        </label>
        <label>
          Relationship
          <input value={form.emergencyRelationship} onChange={(event) => update('emergencyRelationship', event.target.value)} />
        </label>
        <label className="full">
          Contact phone
          <input type="tel" value={form.emergencyPhone} onChange={(event) => update('emergencyPhone', event.target.value)} />
        </label>
        <button className="primary profile-save" type="submit" disabled={updateProfile.isPending}>
          <Save aria-hidden="true" />{updateProfile.isPending ? 'Saving...' : 'Save medical profile'}
        </button>
        {message && <p className={message.type === 'error' ? 'error' : 'message'}>{message.text}</p>}
      </form>
      </section>
    </div>
  );
}
