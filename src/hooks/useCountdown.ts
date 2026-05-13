import { useEffect, useState } from 'react';
import type { CountdownTime } from '../types';
import { calculateCountdown } from '../utils/helpers';

const expiredCountdown: CountdownTime = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: true,
};

export function useCountdown(targetDate: Date | undefined) {
  const [countdown, setCountdown] = useState<CountdownTime>(() => (
    targetDate ? calculateCountdown(targetDate) : expiredCountdown
  ));

  useEffect(() => {
    if (!targetDate) {
      const timeoutId = window.setTimeout(() => setCountdown(expiredCountdown), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const interval = window.setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return countdown;
}
