import { useState, useEffect, useCallback } from 'react';
import { CountdownTime } from '../types';
import { calculateCountdown } from '../utils/helpers';

export function useCountdown(targetDate: Date | undefined) {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  
  const updateCountdown = useCallback(() => {
    if (!targetDate) return;
    const newCountdown = calculateCountdown(targetDate);
    setCountdown(newCountdown);
  }, [targetDate]);
  
  useEffect(() => {
    if (!targetDate) return;
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate, updateCountdown]);
  
  return countdown;
}
