import { useState, useEffect, useRef } from 'react';
import { calculateCountdown } from '../utils/helpers';
import type { CountdownTime } from '../types';

export function useCountdown(targetDate?: Date): CountdownTime {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: !targetDate,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      setCountdown(calculateCountdown(targetDate));
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  return countdown;
}
