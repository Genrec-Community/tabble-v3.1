import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeModeContext = createContext({
  mode: 'dark',
  toggleMode: () => {},
  setMode: () => {},
});

const THEME_MODE_KEY = 'tabble-theme-mode';

const getInitialMode = () => {
  try {
    const stored = localStorage.getItem(THEME_MODE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {
    // localStorage unavailable
  }
  return 'dark';
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
    } catch (e) {
      // ignore
    }
    // Tag the document so global.css can style scrollbars/selection per mode
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);