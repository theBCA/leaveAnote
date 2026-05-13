import { motion } from 'framer-motion';
import type { CountdownTime, NoteTheme } from '../types';
import { THEME_CONFIG } from '../types';

interface CountdownTimerProps {
  countdown: CountdownTime;
  timezone: string;
  theme?: NoteTheme;
}

interface UnitStyle {
  value: string;
  bg: string;
  label: string;
}

function getUnitStyle(theme: NoteTheme): UnitStyle {
  const cfg = THEME_CONFIG[theme];
  if (cfg.isDark) {
    return {
      value: 'text-white',
      bg: 'bg-white/5 border border-white/10 backdrop-blur-lg',
      label: 'text-white/40',
    };
  }
  return {
    value: cfg.accentColor,
    bg: 'bg-white/70 shadow-lg border border-gray-100/60 backdrop-blur-lg',
    label: 'text-gray-500',
  };
}

export default function CountdownTimer({ countdown, timezone, theme = 'classic' }: CountdownTimerProps) {
  if (countdown.isExpired) return null;

  const cfg = THEME_CONFIG[theme];
  const style = getUnitStyle(theme);

  const units = [
    { value: countdown.days, label: 'Days' },
    { value: countdown.hours, label: 'Hours' },
    { value: countdown.minutes, label: 'Minutes' },
    { value: countdown.seconds, label: 'Seconds' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <h2 className={`text-xl font-semibold mb-6 tracking-wide uppercase ${cfg.isDark ? 'text-white/50' : 'text-gray-400'}`}>
        Time Until Reveal
      </h2>

      <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-xl mx-auto">
        {units.map((unit, i) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl p-4 ${style.bg}`}
          >
            <div className={`text-3xl md:text-5xl font-bold tabular-nums ${style.value}`}>
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-1 ${style.label}`}>
              {unit.label}
            </div>
          </motion.div>
        ))}
      </div>

      <p className={`mt-4 text-xs ${cfg.isDark ? 'text-white/35' : 'text-gray-400'}`}>
        Scheduled in {timezone}
      </p>
    </motion.div>
  );
}
