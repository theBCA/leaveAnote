import { motion } from 'framer-motion';
import { formatCountdown } from '../utils/helpers';
import type { CountdownTime } from '../types';

interface CountdownTimerProps {
  countdown: CountdownTime;
  timezone: string;
}

export default function CountdownTimer({ countdown, timezone }: CountdownTimerProps) {
  if (countdown.isExpired) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Time Until Reveal
      </h2>
      
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
        <div className="card">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {String(countdown.days).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 font-medium">Days</div>
        </div>
        <div className="card">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {String(countdown.hours).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 font-medium">Hours</div>
        </div>
        <div className="card">
          <div className="text-4xl font-bold text-pink-600 mb-2">
            {String(countdown.minutes).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 font-medium">Minutes</div>
        </div>
        <div className="card">
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {String(countdown.seconds).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 font-medium">Seconds</div>
        </div>
      </div>

      <p className="text-gray-600">
        {formatCountdown(countdown)}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Timezone: {timezone}
      </p>
    </motion.div>
  );
}
