import { createContext } from 'react';

export type AppTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});
