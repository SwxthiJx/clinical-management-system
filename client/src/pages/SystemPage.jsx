import { Activity, Clock3, Database, Gauge, ScrollText, Server } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAuditLogs, useSystemStatus } from '../hooks/useClinicQueries.js';
import { formatDateTime } from '../utils/formatters.js';

function formatAction(action) {
  return action.replaceAll('.', ' ').replaceAll('_', ' ');
}

export default function SystemPage() {
  const { user } = useAuth();
  const statusQuery = useSystemStatus(user.role === 'admin');
  const auditQuery = useAuditLogs(user.role === 'admin');

  if (user.role !== 'admin') return <Navigate to="/appointments" replace />;
  if (statusQuery.isLoading || auditQuery.isLoading) {
    return <section className="panel">Loading operational data...</section>;
  }

  const status = statusQuery.data;
  const metrics = status?.metrics || {};
  const auditLogs = auditQuery.data || [];
  const error = statusQuery.error || auditQuery.error;

  return (
    <div className="main-column">
      {error && <p className="error">{error.message}</p>}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Operations</span>
            <h2>System health</h2>
          </div>
          <span className={`system-state ${status?.status || 'degraded'}`}>{status?.status || 'Unavailable'}</span>
        </div>
        <div className="operations-grid">
          <div><Database aria-hidden="true" /><strong>{status?.database || 'Unknown'}</strong><span>Database</span></div>
          <div><Server aria-hidden="true" /><strong>{status?.environment || 'Unknown'}</strong><span>Environment</span></div>
          <div><Clock3 aria-hidden="true" /><strong>{metrics.uptimeSeconds || 0}s</strong><span>API uptime</span></div>
          <div><Activity aria-hidden="true" /><strong>{metrics.totalRequests || 0}</strong><span>Requests</span></div>
          <div><Gauge aria-hidden="true" /><strong>{metrics.averageResponseMs || 0} ms</strong><span>Average response</span></div>
          <div><Activity aria-hidden="true" /><strong>{metrics.totalErrors || 0}</strong><span>Server errors</span></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Accountability</span>
            <h2>Recent audit activity</h2>
          </div>
          <span>{auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'}</span>
        </div>
        <div className="audit-list">
          {auditLogs.map((entry) => (
            <article className="audit-entry" key={entry._id}>
              <ScrollText aria-hidden="true" />
              <div>
                <strong>{formatAction(entry.action)}</strong>
                <p>{entry.actor?.name || 'System'} · {entry.actorRole}</p>
              </div>
              <div className="audit-context">
                <span>{entry.entityType}{entry.entityId ? ` · ${entry.entityId.slice(-8)}` : ''}</span>
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
              </div>
            </article>
          ))}
          {!auditLogs.length && <p className="empty">No audit events have been recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
