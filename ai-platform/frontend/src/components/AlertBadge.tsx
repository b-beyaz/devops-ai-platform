import { AlertPayload } from '../types/index';

const colors = {
  critical: { border: '#e01e5a', title: '#ff6b6b', bg: '#2a1a1a' },
  warning:  { border: '#f5a623', title: '#f5c542', bg: '#2a2010' },
  info:     { border: '#378add', title: '#7abfde', bg: '#0d1f2d' },
};

export function AlertBadge({ alert }: { alert: AlertPayload }) {
  const c = colors[alert.severity];
  return (
    <div
      className="mt-2 rounded-r-md px-3 py-2 text-xs font-mono"
      style={{ borderLeft: `3px solid ${c.border}`, background: c.bg }}
    >
      <p className="font-bold mb-0.5" style={{ color: c.title }}>
        {alert.severity.toUpperCase()} — {alert.source}
      </p>
      <p className="text-slack-muted">{alert.message}</p>
      {alert.metadata && (
        <p className="text-slack-muted mt-0.5">
          {Object.entries(alert.metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')}
        </p>
      )}
    </div>
  );
}