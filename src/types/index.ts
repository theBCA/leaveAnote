export type NoteStatus = 'pending' | 'revealed' | 'read';

export type NoteTheme =
  | 'classic'
  | 'birthday'
  | 'love'
  | 'anniversary'
  | 'graduation'
  | 'thankyou'
  | 'surprise'
  | 'farewell'
  | 'motivation'
  | 'apology';

export interface NoteData {
  id: string;
  message?: string;
  unlockTime: Date;
  createdAt: Date;
  status: NoteStatus;
  timezone: string;
  revealedAt?: Date;
  readAt?: Date;
  theme?: NoteTheme;
  teaser?: string;
  senderName?: string;
}

export interface CreateNoteInput {
  message: string;
  unlockTime: Date;
  files: File[];
  timezone: string;
  theme?: NoteTheme;
  teaser?: string;
  senderName?: string;
}

export interface ShareLinks {
  recipientLink: string;
  senderLink: string;
  qrCodeData: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export interface ThemeConfigEntry {
  label: string;
  description: string;
  gradient: string;
  accentColor: string;
  textColor: string;
  badgeColor: string;
  icon: string;
  isDark: boolean;
  particles: string[];
  revealTitle: string;
  bgClass: string;
  cardClass: string;
  messageBgClass: string;
}

export const THEME_CONFIG: Record<NoteTheme, ThemeConfigEntry> = {
  classic: {
    label: 'Just a Note',
    description: 'Clean & timeless',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    accentColor: 'text-blue-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: 'Envelope',
    isDark: false,
    particles: ['Spark', 'Star', 'Note'],
    revealTitle: 'Your Message Has Arrived',
    bgClass: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    cardClass: 'bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-blue-50/80 to-purple-50/80',
  },
  birthday: {
    label: 'Birthday',
    description: 'Confetti & celebration',
    gradient: 'from-pink-500 via-amber-400 to-yellow-400',
    accentColor: 'text-pink-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-pink-100 text-pink-800',
    icon: 'Cake',
    isDark: false,
    particles: ['Balloon', 'Confetti', 'Gift'],
    revealTitle: 'Happy Birthday!',
    bgClass: 'bg-gradient-to-br from-pink-100 via-amber-50 to-yellow-100',
    cardClass: 'bg-white/85 backdrop-blur-xl border border-pink-200/60 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-pink-50/80 to-amber-50/80',
  },
  love: {
    label: 'Love Letter',
    description: 'Warm and romantic',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    accentColor: 'text-rose-600',
    textColor: 'text-white',
    badgeColor: 'bg-rose-100 text-rose-800',
    icon: 'Heart',
    isDark: true,
    particles: ['Heart', 'Rose', 'Glow'],
    revealTitle: 'With All My Love',
    bgClass: 'bg-gradient-to-br from-rose-950 via-pink-950 to-red-950',
    cardClass: 'bg-white/5 backdrop-blur-xl border border-rose-400/20 shadow-2xl',
    messageBgClass: 'bg-white/5',
  },
  anniversary: {
    label: 'Anniversary',
    description: 'Elegant & golden',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    accentColor: 'text-amber-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: 'Cheers',
    isDark: false,
    particles: ['Spark', 'Ribbon', 'Glow'],
    revealTitle: 'Cheers to Us',
    bgClass: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
    cardClass: 'bg-white/85 backdrop-blur-xl border border-amber-300/40 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-amber-50/80 to-yellow-50/80',
  },
  graduation: {
    label: 'Graduation',
    description: 'Proud & accomplished',
    gradient: 'from-indigo-600 via-blue-700 to-indigo-800',
    accentColor: 'text-indigo-500',
    textColor: 'text-white',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    icon: 'Cap',
    isDark: true,
    particles: ['Cap', 'Medal', 'Spark'],
    revealTitle: 'Congratulations, Graduate!',
    bgClass: 'bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-950',
    cardClass: 'bg-white/5 backdrop-blur-xl border border-indigo-400/20 shadow-2xl',
    messageBgClass: 'bg-white/5',
  },
  thankyou: {
    label: 'Thank You',
    description: 'Warm gratitude',
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    accentColor: 'text-emerald-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: 'Thanks',
    isDark: false,
    particles: ['Leaf', 'Glow', 'Sun'],
    revealTitle: 'A Heartfelt Thank You',
    bgClass: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50',
    cardClass: 'bg-white/85 backdrop-blur-xl border border-emerald-200/60 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80',
  },
  surprise: {
    label: 'Surprise',
    description: 'Exciting reveal',
    gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
    accentColor: 'text-fuchsia-500',
    textColor: 'text-white',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800',
    icon: 'Surprise',
    isDark: true,
    particles: ['Spark', 'Ribbon', 'Burst'],
    revealTitle: 'Surprise!',
    bgClass: 'bg-gradient-to-br from-violet-950 via-fuchsia-950 to-pink-950',
    cardClass: 'bg-white/5 backdrop-blur-xl border border-fuchsia-400/20 shadow-2xl',
    messageBgClass: 'bg-white/5',
  },
  farewell: {
    label: 'Farewell',
    description: 'Warm goodbye',
    gradient: 'from-orange-400 via-rose-400 to-pink-500',
    accentColor: 'text-orange-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: 'Sunset',
    isDark: false,
    particles: ['Sunset', 'Leaf', 'Trail'],
    revealTitle: 'Until We Meet Again',
    bgClass: 'bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50',
    cardClass: 'bg-white/85 backdrop-blur-xl border border-orange-200/60 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-orange-50/80 to-rose-50/80',
  },
  motivation: {
    label: 'Motivation',
    description: 'Bold & inspiring',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    accentColor: 'text-orange-500',
    textColor: 'text-white',
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: 'Flame',
    isDark: true,
    particles: ['Flame', 'Bolt', 'Rocket'],
    revealTitle: 'You Got This!',
    bgClass: 'bg-gradient-to-br from-gray-950 via-orange-950 to-red-950',
    cardClass: 'bg-white/5 backdrop-blur-xl border border-orange-400/20 shadow-2xl',
    messageBgClass: 'bg-white/5',
  },
  apology: {
    label: 'Apology',
    description: 'Sincere & gentle',
    gradient: 'from-sky-400 via-blue-400 to-indigo-400',
    accentColor: 'text-sky-600',
    textColor: 'text-gray-900',
    badgeColor: 'bg-sky-100 text-sky-800',
    icon: 'Letter',
    isDark: false,
    particles: ['Wave', 'Glow', 'Bloom'],
    revealTitle: 'From the Heart',
    bgClass: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50',
    cardClass: 'bg-white/85 backdrop-blur-xl border border-sky-200/60 shadow-2xl',
    messageBgClass: 'bg-gradient-to-br from-sky-50/80 to-blue-50/80',
  },
};
