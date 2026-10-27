import { formatTime } from '../utils/format';

const ICONS = {
  RFQ_CREATED: '📄',
  BID_PLACED: '💰',
  TIME_EXTENDED: '⏱️',
};

function ActivityLog({ logs }) {
  if (logs.length === 0) return <p className="muted">No activity yet.</p>;

  return (
    <ul className="activity-log">
      {logs.map((log) => (
        <li key={log._id} className={'log log-' + log.type.toLowerCase()}>
          <span className="log-icon">{ICONS[log.type]}</span>
          <div>
            <p className="log-message">{log.message}</p>
            {log.type === 'TIME_EXTENDED' && (
              <>
                <p className="log-reason">Reason: {log.reason}</p>
                <p className="log-reason">
                  {formatTime(log.oldCloseTime)} → {formatTime(log.newCloseTime)}
                </p>
              </>
            )}
            <p className="log-time">{formatTime(log.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ActivityLog;
