function StatusBadge({ status }) {
  // "Force Closed" -> "force-closed"
  const className = 'badge badge-' + status.toLowerCase().replace(' ', '-');
  return <span className={className}>{status}</span>;
}

export default StatusBadge;
