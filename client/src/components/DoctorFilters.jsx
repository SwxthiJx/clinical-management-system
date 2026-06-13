import { RotateCcw, Search } from 'lucide-react';

export const emptyDoctorFilters = {
  search: '',
  specialty: ''
};

export function filterDoctors(doctors, filters) {
  const search = filters.search.trim().toLowerCase();
  return doctors.filter((doctor) => {
    const matchesSearch =
      !search ||
      doctor.name.toLowerCase().includes(search);
    const matchesSpecialty =
      !filters.specialty || doctor.specialty === filters.specialty;

    return matchesSearch && matchesSpecialty;
  });
}

export default function DoctorFilters({
  filters,
  specialties,
  resultCount,
  onChange,
  onReset
}) {
  const hasFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="filter-surface" aria-label="Doctor filters">
      <label className="search-field">
        <span>Search doctors</span>
        <div>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={filters.search}
            placeholder="Search by doctor name"
            onChange={(event) => onChange('search', event.target.value)}
          />
        </div>
      </label>
      <label>
        Specialty
        <select value={filters.specialty} onChange={(event) => onChange('specialty', event.target.value)}>
          <option value="">All specialties</option>
          {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
        </select>
      </label>
      <div className="filter-summary">
        <span>{resultCount} {resultCount === 1 ? 'doctor' : 'doctors'} found</span>
        <button type="button" onClick={onReset} disabled={!hasFilters}>
          <RotateCcw aria-hidden="true" />Reset
        </button>
      </div>
    </div>
  );
}
