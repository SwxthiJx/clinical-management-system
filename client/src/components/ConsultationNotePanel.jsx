import { useEffect, useMemo, useState } from 'react';
import { ClipboardPlus, FileCheck2, Save, X } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters.js';

const emptyNote = {
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  prescriptions: '',
  followUpInstructions: '',
  followUpDate: '',
  privateNotes: ''
};

const clinicalFields = [
  ['subjective', 'Symptoms and history'],
  ['objective', 'Examination and observations'],
  ['assessment', 'Assessment and diagnosis'],
  ['plan', 'Treatment plan'],
  ['prescriptions', 'Prescriptions'],
  ['followUpInstructions', 'Follow-up instructions']
];

function noteValues(note) {
  if (!note) return emptyNote;
  return {
    ...emptyNote,
    ...note,
    followUpDate: note.followUpDate?.slice(0, 10) || ''
  };
}

function NoteDetails({ note, showPrivateNotes }) {
  return (
    <div className="consultation-note-details">
      {clinicalFields.map(([key, label]) => (
        <div key={key}>
          <span>{label}</span>
          <p>{note[key] || 'Not recorded'}</p>
        </div>
      ))}
      <div>
        <span>Follow-up date</span>
        <p>{note.followUpDate ? formatDate(note.followUpDate) : 'Not scheduled'}</p>
      </div>
      {showPrivateNotes && (
        <div className="private-note">
          <span>Private doctor notes</span>
          <p>{note.privateNotes || 'No private notes'}</p>
        </div>
      )}
    </div>
  );
}

export default function ConsultationNotePanel({
  appointment,
  user,
  note,
  loading,
  error,
  pending,
  message,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(emptyNote);
  const isDoctor = user.role === 'doctor';
  const isCancelled = appointment.status === 'cancelled';
  const canEdit = isDoctor && !isCancelled;
  const hasClinicalContent = useMemo(
    () => ['subjective', 'objective', 'assessment', 'plan'].some((key) => form[key].trim()),
    [form]
  );

  useEffect(() => setForm(noteValues(note)), [note, appointment._id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const counterpart =
    user.role === 'patient' ? appointment.doctor?.name : appointment.patient?.name;

  return (
    <section className="consultation-panel" aria-labelledby="consultation-note-title">
      <div className="consultation-heading">
        <div>
          <span className="eyebrow">Clinical record</span>
          <h3 id="consultation-note-title">Consultation notes for {counterpart}</h3>
          <p>{formatDateTime(appointment.startTime)}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close consultation notes">
          <X aria-hidden="true" />
        </button>
      </div>

      {loading && <p className="empty">Loading consultation notes...</p>}
      {!loading && error && <p className="error">{error.message}</p>}

      {!loading && !error && (!isDoctor || isCancelled) && !note && (
        <div className="consultation-empty">
          <ClipboardPlus aria-hidden="true" />
          <div>
            <strong>{isCancelled ? 'No consultation notes recorded' : 'No patient-visible notes yet'}</strong>
            <p>
              {isCancelled
                ? 'This appointment was cancelled, so new consultation notes cannot be added.'
                : 'The assigned doctor can save a draft now. These notes will appear here after the doctor selects “Finalize for patient.”'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (!isDoctor || isCancelled) && note && (
        <>
          <div className="note-meta">
            <span className={`status ${note.status}`}>{note.status}</span>
            <span>Updated {formatDateTime(note.updatedAt)}</span>
          </div>
          <NoteDetails note={note} showPrivateNotes={user.role === 'admin' || isDoctor} />
        </>
      )}

      {!loading && !error && canEdit && (
        <form className="consultation-form" onSubmit={(event) => event.preventDefault()}>
          <div className="note-meta">
            <span className={`status ${note?.status || 'draft'}`}>{note?.status || 'New draft'}</span>
            {note && <span>Revision {note.revision}</span>}
          </div>

          <div className="consultation-grid">
            {clinicalFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  value={form[key]}
                  maxLength={key === 'followUpInstructions' ? 2000 : 4000}
                  onChange={(event) => update(key, event.target.value)}
                />
              </label>
            ))}
            <label>
              Follow-up date
              <input
                type="date"
                value={form.followUpDate}
                onChange={(event) => update('followUpDate', event.target.value)}
              />
            </label>
            <label>
              Private doctor notes
              <textarea
                value={form.privateNotes}
                maxLength={4000}
                onChange={(event) => update('privateNotes', event.target.value)}
              />
              <small>Visible only to the assigned doctor and administrators.</small>
            </label>
          </div>

          <div className="consultation-footer">
            {note?.status !== 'finalized' && (
              <button
                type="button"
                disabled={pending || !hasClinicalContent}
                onClick={() => onSubmit({ ...form, status: 'draft' })}
              >
                <Save aria-hidden="true" />Save draft
              </button>
            )}
            <button
              className="primary"
              type="button"
              disabled={pending || !hasClinicalContent}
              onClick={() => onSubmit({ ...form, status: 'finalized' })}
            >
              <FileCheck2 aria-hidden="true" />
              {pending ? 'Saving...' : note?.status === 'finalized' ? 'Update finalized note' : 'Finalize for patient'}
            </button>
            {message && <span className={message.type === 'error' ? 'error' : 'message'}>{message.text}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
