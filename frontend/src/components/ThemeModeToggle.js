import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../themeMode';

const ThemeModeToggle = ({ size = 24, sx = {} }) => {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleMode}
        aria-label="Toggle light/dark theme"
        sx={{
          color: 'primary.main',
          ...sx,
        }}
      >
        {isDark ? <LightModeIcon sx={{ fontSize: size }} /> : <DarkModeIcon sx={{ fontSize: size }} />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeModeToggle;