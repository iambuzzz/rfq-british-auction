import { useEffect, useState } from 'react';
import { formatTime } from '../utils/format';

// a simple bar from bid start to forced close.
// blue = original bidding time, orange = time added by extensions
function AuctionTimeline({ rfq }) {
  const [now, setNow] = useState(Date.now());

  // move the "now" line every few seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const start = new Date(rfq.bidStartTime).getTime();
  const end = new Date(rfq.forcedCloseTime).getTime();

  const percent = (time) => {
    const value = ((new Date(time).getTime() - start) / (end - start)) * 100;
    return Math.min(Math.max(value, 0), 100);
  };

  const originalClose = percent(rfq.bidCloseTime);
  const currentClose = percent(rfq.currentCloseTime);

  return (
    <div className="timeline">
      <div className="timeline-bar">
        <div className="timeline-original" style={{ width: `${originalClose}%` }} />
        <div
          className="timeline-extended"
          style={{ left: `${originalClose}%`, width: `${currentClose - originalClose}%` }}
        />
        <div className="timeline-now" style={{ left: `${percent(now)}%` }} title="Now" />
      </div>

      <div className="timeline-legend">
        <span><i className="dot dot-start" /> Start {formatTime(rfq.bidStartTime)}</span>
        <span><i className="dot dot-original" /> Original close {formatTime(rfq.bidCloseTime)}</span>
        <span><i className="dot dot-current" /> Current close {formatTime(rfq.currentCloseTime)}</span>
        <span><i className="dot dot-forced" /> Forced close {formatTime(rfq.forcedCloseTime)}</span>
      </div>
    </div>
  );
}

export default AuctionTimeline;
