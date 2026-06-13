import { useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import AnalyticsCharts from '../components/AnalyticsCharts.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAdminAnalytics } from '../hooks/useClinicQueries.js';
import { formatDate } from '../utils/formatters.js';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const analyticsQuery = useAdminAnalytics(days, user.role === 'admin');

  if (user.role !== 'admin') return <Navigate to="/appointments" replace />;

  const analytics = analyticsQuery.data;

  return (
    <div className="main-column">
      <PageHeader
        eyebrow="Insights"
        title="Clinic analytics"
        description="Track appointment demand, patient activity, cancellations, and schedule utilization."
        icon={ChartNoAxesCombined}
      />
      <section className="panel analytics-header">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Admin analytics</span>
            <h2>Clinic performance</h2>
          </div>
          <div className="analytics-range" aria-label="Analytics date range">
            {[30, 90, 180].map((range) => (
              <button
                className={days === range ? 'active' : ''}
                key={range}
                type="button"
                onClick={() => setDays(range)}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>
        {analytics && (
          <p className="analytics-period">
            Reporting period: {formatDate(analytics.period.startDate)} to {formatDate(analytics.period.endDate)}
          </p>
        )}
      </section>

      {analyticsQuery.isLoading && <section className="panel">Loading analytics...</section>}
      {analyticsQuery.error && <p className="error">{analyticsQuery.error.message}</p>}
      {analytics && <AnalyticsCharts analytics={analytics} />}
    </div>
  );
}
