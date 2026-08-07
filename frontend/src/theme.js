import { createTheme } from '@mui/material/styles';

const getPalette = (mode) => {
  const isDark = mode === 'dark';

  return {
    mode,
    primary: {
      main: '#FFA500', // Vibrant Orange as primary color
      light: '#FFB733', // Light Orange for subtle highlights
      dark: '#E69500', // Dark Orange for hover states
      contrastText: '#FFFFFF',
    },
    secondary: isDark
      ? {
          main: '#000000', // Black as secondary color
          light: '#333333',
          dark: '#000000',
          contrastText: '#FFFFFF',
        }
      : {
          main: '#333333',
          light: '#666666',
          dark: '#111111',
          contrastText: '#FFFFFF',
        },
    error: {
      main: '#FF385C',
    },
    warning: {
      main: '#FFA500', // Using orange for warnings too
      light: '#FFB733',
    },
    success: {
      main: '#4DAA57',
      light: '#6ECF77',
    },
    info: {
      main: '#2196F3',
    },
    background: isDark
      ? {
          default: '#000000', // Black background
          paper: '#121212', // Dark paper background
        }
      : {
          default: '#F7F6F3', // Warm off-white background
          paper: '#FFFFFF', // White paper background
        },
    text: isDark
      ? {
          primary: '#FFFFFF', // White text for dark backgrounds
          secondary: '#F5F5F5', // Light gray for secondary text
        }
      : {
          primary: '#1A1A1A', // Dark text for light backgrounds
          secondary: '#555555', // Medium gray for secondary text
        },
    divider: isDark ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 0, 0, 0.12)',
  };
};

const typography = {
  fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif', // Elegant sans-serif font
  h1: {
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontSize: '32px',
  },
  h2: {
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontSize: '28px',
  },
  h3: {
    fontWeight: 600,
    fontSize: '24px',
  },
  h4: {
    fontWeight: 600,
    fontSize: '22px',
  },
  h5: {
    fontWeight: 600,
    fontSize: '20px',
  },
  h6: {
    fontWeight: 600,
    fontSize: '18px',
  },
  button: {
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '16px',
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '16px',
  },
  body1: {
    fontSize: '16px',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '14px',
    lineHeight: 1.5,
  },
};

const shadows = [
  'none',
  '0px 2px 4px rgba(0,0,0,0.15)',
  '0px 4px 8px rgba(0,0,0,0.16)',
  '0px 6px 12px rgba(0,0,0,0.18)',
  '0px 8px 16px rgba(0,0,0,0.18)',
  '0px 10px 20px rgba(0,0,0,0.19)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
  '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
];

const getComponents = (mode) => {
  const isDark = mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: isDark ? '#000000' : '#F7F6F3',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        },
        html: {
          backgroundColor: isDark ? '#000000' : '#F7F6F3',
        },
        '#root': {
          backgroundColor: isDark ? '#000000' : '#F7F6F3',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          boxShadow: isDark
            ? '0 8px 20px rgba(0, 0, 0, 0.16)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: isDark
              ? '0 12px 24px rgba(0, 0, 0, 0.18)'
              : '0 6px 16px rgba(0, 0, 0, 0.1)',
          },
          borderTop: '1px solid rgba(255, 165, 0, 0.3)', // Subtle orange accent
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '4px',
          fontWeight: 600,
          padding: '8px 16px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.17)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: '#FFA500', // Solid orange for primary buttons
            '&:hover': {
              background: '#E69500', // Darker orange on hover
            },
          },
          '&.MuiButton-containedSecondary': {
            background: isDark ? '#000000' : '#333333', // Black secondary buttons
            '&:hover': {
              background: '#333333',
            },
          },
        },
        outlined: {
          borderWidth: '2px',
          '&.MuiButton-outlinedPrimary': {
            borderColor: '#FFA500',
            color: '#FFA500',
            '&:hover': {
              borderColor: '#E69500',
              backgroundColor: 'rgba(255, 165, 0, 0.08)',
            },
          },
        },
        text: {
          '&.MuiButton-textPrimary': {
            color: '#FFA500',
            '&:hover': {
              backgroundColor: 'rgba(255, 165, 0, 0.08)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          boxShadow: isDark
            ? '0 2px 10px rgba(0, 0, 0, 0.15)'
            : '0 1px 6px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: '4px',
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#FFA500',
          },
        },
        outlined: {
          '&.MuiChip-colorPrimary': {
            borderColor: '#FFA500',
            color: '#FFA500',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 165, 0, 0.1)', // Subtle orange background
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 165, 0, 0.2)', // Orange border around entire table
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 165, 0, 0.15)', // Orange border between rows
          '&:hover': {
            backgroundColor: 'rgba(255, 165, 0, 0.05)', // Subtle orange hover
          },
          '&:last-child': {
            borderBottom: 'none', // Remove border from last row
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 165, 0, 0.15)', // Consistent cell borders
          '&:not(:last-child)': {
            borderRight: '1px solid rgba(255, 165, 0, 0.1)', // Vertical borders between cells
          },
        },
        head: {
          borderBottom: '2px solid rgba(255, 165, 0, 0.3)', // Stronger border for header
          fontWeight: 'bold',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 165, 0, 0.2)', // Subtle orange dividers
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.23)'
                : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 165, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFA500',
            },
          },
          '& .MuiInputLabel-root': {
            color: isDark ? '#F5F5F5' : '#555555',
            '&.Mui-focused': {
              color: '#FFA500',
            },
          },
          '& .MuiInputBase-input': {
            color: isDark ? '#FFFFFF' : '#1A1A1A',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 165, 0, 0.1)', // Subtle border between list items
          '&:last-child': {
            borderBottom: 'none', // Remove border from last item
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 165, 0, 0.16)',
            borderLeft: '3px solid #FFA500', // Orange accent for selected items
            '&:hover': {
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 165, 0, 0.05)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 165, 0, 0.1)', // Border between menu items
          '&:last-child': {
            borderBottom: 'none', // Remove border from last item
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 165, 0, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 165, 0, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(255, 165, 0, 0.16)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          borderRadius: '8px',
          border: '1px solid rgba(255, 165, 0, 0.15)', // Subtle border around paper components
          '&.MuiMenu-paper': {
            border: '1px solid rgba(255, 165, 0, 0.2)', // Stronger border for dropdown menus
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 4px 16px rgba(0, 0, 0, 0.12)',
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
          },
        },
      },
    },
  };
};

// Single source of truth for the whole UI theme.
// Switch between 'dark' (default) and 'light' to restyle the entire app.
export const getTheme = (mode) =>
  createTheme({
    palette: getPalette(mode),
    typography,
    shape: {
      borderRadius: 6, // Slightly reduced border radius for more elegant look
    },
    shadows,
    components: getComponents(mode),
  });
