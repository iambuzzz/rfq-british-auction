import { useEffect, useState } from 'react';

const pad = (num) => String(num).padStart(2, '0');

function Countdown({ targetTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(new Date(targetTime) - new Date());

  useEffect(() => {
    setTimeLeft(new Date(targetTime) - new Date());

    const timer = setInterval(() => {
      const diff = new Date(targetTime) - new Date();
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timer);
        if (onEnd) onEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  if (timeLeft <= 0) return <span className="countdown">00:00:00</span>;

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // red when less than 2 minutes are left
  const className = timeLeft < 2 * 60 * 1000 ? 'countdown urgent' : 'countdown';

  return (
    <span className={className}>
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

export default Countdown;
