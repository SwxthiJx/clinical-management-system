import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleX,
  Stethoscope,
  UsersRound
} from 'lucide-react';

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="analytics-metric">
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function TrendChart({ title, description, data, valueKey, tone }) {
  const maximum = Math.max(1, ...data.map((item) => item[valueKey] || 0));

  return (
    <section className="analytics-chart">
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div
        className={`vertical-chart ${tone}`}
        role="img"
        aria-label={`${title}. ${data.map((item) => `${item.label}: ${item[valueKey]}`).join(', ')}`}
      >
        {data.map((item) => (
          <div className="vertical-chart-column" key={`${valueKey}-${item.startDate}`}>
            <span className="chart-value">{item[valueKey]}</span>
            <div className="vertical-chart-track">
              <div
                style={{
                  height: item[valueKey]
                    ? `${Math.max(3, (item[valueKey] / maximum) * 100)}%`
                    : '0'
                }}
              />
            </div>
            <span className="chart-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RankedBars({ title, description, items, value, label, detail, tone = '' }) {
  const maximum = Math.max(1, ...items.map(value));

  return (
    <section className="analytics-chart">
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className={`ranked-chart ${tone}`}>
        {items.map((item) => (
          <div className="ranked-row" key={label(item)}>
            <div className="ranked-label">
              <strong>{label(item)}</strong>
              <span>{detail(item)}</span>
            </div>
            <div className="ranked-track">
              <div style={{ width: `${(value(item) / maximum) * 100}%` }} />
            </div>
            <strong className="ranked-value">{value(item)}{tone === 'percentage' ? '%' : ''}</strong>
          </div>
        ))}
        {!items.length && <p className="empty compact">No activity in this period.</p>}
      </div>
    </section>
  );
}

export default function AnalyticsCharts({ analytics }) {
  const { summary, trend, doctorUtilization, popularSpecialties } = analytics;

  return (
    <>
      <div className="analytics-metrics">
        <MetricCard
          icon={CalendarDays}
          label="Appointments"
          value={summary.appointmentCount}
          detail="Scheduled in this period"
        />
        <MetricCard
          icon={CircleX}
          label="Cancellation rate"
          value={formatPercent(summary.cancellationRate)}
          detail={`${summary.cancellationCount} cancelled`}
        />
        <MetricCard
          icon={UsersRound}
          label="Active patients"
          value={summary.activePatients}
          detail={`${summary.registeredActivePatients} registered and active`}
        />
        <MetricCard
          icon={Stethoscope}
          label="Doctor utilization"
          value={formatPercent(summary.averageDoctorUtilization)}
          detail="Occupied schedule capacity"
        />
        <MetricCard
          icon={ChartNoAxesCombined}
          label="Top specialty"
          value={summary.topSpecialty}
          detail="Highest appointment demand"
        />
      </div>

      <div className="analytics-grid">
        <TrendChart
          title="Appointment volume"
          description="Total scheduled visits over time"
          data={trend}
          valueKey="total"
          tone="volume"
        />
        <TrendChart
          title="Cancellations"
          description="Cancelled visits over time"
          data={trend}
          valueKey="cancelled"
          tone="cancellations"
        />
        <TrendChart
          title="Active patients"
          description="Unique patients with non-cancelled visits"
          data={trend}
          valueKey="activePatients"
          tone="patients"
        />
        <RankedBars
          title="Doctor utilization"
          description="Occupied appointments compared with recurring schedule capacity"
          items={doctorUtilization}
          value={(doctor) => doctor.utilizationRate}
          label={(doctor) => doctor.name}
          detail={(doctor) => `${doctor.specialty} · ${doctor.occupiedSlots}/${doctor.availableSlots} slots`}
          tone="percentage"
        />
        <RankedBars
          title="Popular specialties"
          description="Appointment demand grouped by specialty"
          items={popularSpecialties}
          value={(specialty) => specialty.appointmentCount}
          label={(specialty) => specialty.specialty}
          detail={(specialty) =>
            `${specialty.appointmentCount} ${specialty.appointmentCount === 1 ? 'appointment' : 'appointments'}`
          }
        />
      </div>
    </>
  );
}
