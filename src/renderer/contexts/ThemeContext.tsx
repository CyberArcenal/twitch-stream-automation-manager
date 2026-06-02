import React, { createContext, useContext, useState, useEffect } from 'react';
import { themesAPI } from '../api/core/themes';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Light theme CSS variables (override dark defaults)
const lightThemeVars = {
  '--background-color': '#ffffff',
  '--sidebar-bg': '#f7f7f9',
  '--sidebar-border': '#e0e0e6',
  '--sidebar-text': '#0e0e10',
  '--card-bg': '#ffffff',
  '--card-secondary-bg': '#f2f2f5',
  '--card-hover-bg': '#e8e8ec',
  '--card-border': '#e2e2e2',
  '--border-color': '#e0e0e6',
  '--border-light': '#e8e8ec',
  '--text-primary': '#0e0e10',
  '--text-secondary': '#53535f',
  '--text-tertiary': '#7a7a8c',
  '--input-bg': '#f2f2f5',
  '--input-border': '#e0e0e6',
  '--btn-secondary-bg': '#e8e8ec',
  '--btn-secondary-hover': '#d9d9e0',
  '--btn-secondary-text': '#0e0e10',
  '--status-success-bg': 'rgba(0, 181, 184, 0.1)',
  '--status-inactive-bg': 'rgba(90, 90, 112, 0.1)',
};

const darkThemeVars = {
  '--background-color': '#0e0e10',
  '--sidebar-bg': '#1f1f2b',
  '--sidebar-border': '#2d2d3a',
  '--sidebar-text': '#efeff1',
  '--card-bg': '#1f1f23',
  '--card-border': '#2a2a2e',
  '--card-secondary-bg': '#18181b',
  '--card-hover-bg': '#2a2a35',
  '--border-color': '#2d2d3a',
  '--border-light': '#3a3a4a',
  '--text-primary': '#efeff1',
  '--text-secondary': '#adadb8',
  '--text-tertiary': '#7a7a8c',
  '--input-bg': '#2d2d3a',
  '--input-border': '#3a3a4a',
  '--btn-secondary-bg': '#2d2d3a',
  '--btn-secondary-hover': '#3a3a4a',
  '--btn-secondary-text': '#efeff1',
  '--status-success-bg': 'rgba(0, 181, 184, 0.15)',
  '--status-inactive-bg': 'rgba(90, 90, 112, 0.15)',
};

const applyTheme = (theme: 'light' | 'dark') => {
  const vars = theme === 'light' ? lightThemeVars : darkThemeVars;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  const loadTheme = async () => {
    try {
      const res = await themesAPI.getCurrent();
      if (res.status && res.data) {
        setThemeState(res.data);
        applyTheme(res.data);
      }
    } catch (err) {
      console.error('Failed to load theme', err);
    }
  };

  useEffect(() => {
    loadTheme();
    // Listen for theme changes from other windows (e.g., settings changed)
    const unsubscribe = window.backendAPI?.on?.('theme:changed', (data: { theme: 'light' | 'dark' }) => {
      setThemeState(data.theme);
      applyTheme(data.theme);
    });
    return () => unsubscribe?.();
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark') => {
    try {
      await themesAPI.set(newTheme);
      setThemeState(newTheme);
      applyTheme(newTheme);
    } catch (err) {
      console.error('Failed to set theme', err);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};