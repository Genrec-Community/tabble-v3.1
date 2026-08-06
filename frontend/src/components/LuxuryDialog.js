import React from 'react';
import { Dialog, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const LuxuryDialog = ({ title, children, onClose, sx, titleSx, ...props }) => (
  <Dialog
    onClose={onClose}
    PaperProps={{
      sx: {
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderRadius: '8px',
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
      },
    }}
    {...props}
  >
    {title && (
      <DialogTitle sx={{ fontWeight: 700, pr: 6, ...titleSx }}>
        {title}
        {onClose && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.primary',
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
    )}
    {children}
  </Dialog>
);

export default LuxuryDialog;
