import React from 'react';
import { Paper } from '@mui/material';

const LuxuryCard = ({ children, sx, ...props }) => (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      borderRadius: '6px',
      backgroundColor: 'background.paper',
      color: 'text.primary',
      border: '1px solid rgba(255, 165, 0, 0.2)',
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        backgroundColor: 'primary.main',
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

export default LuxuryCard;
