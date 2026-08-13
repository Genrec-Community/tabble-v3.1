import {
  Box,
  Card,
  CardMedia,
  Paper,
  Chip,
  Button,
  Tab,
  Tabs,
  styled
} from '@mui/material';

// Styled components for luxury hotel design
export const CategoryTab = styled(Tab)(({ theme }) => ({
  minWidth: 'auto',
  minHeight: 40,
  fontSize: '0.875rem',
  padding: '8px 14px',
  fontWeight: 600,
  textTransform: 'none',
  color: theme.palette.text.secondary,
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.11)',
  backgroundColor: theme.palette.background.paper,
  '&.Mui-selected': {
    backgroundColor: '#F7B538',
    color: '#1A1408',
    fontWeight: 700,
    border: '1px solid transparent',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTabs-flexContainer': {
    gap: theme.spacing(1),
  },
}));

export const DishCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: '16px',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255,255,255,0.08)',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 28px rgba(255, 165, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    '& img': {
      transform: 'scale(1.05)',
    },
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

export const MenuImage = styled(CardMedia)(() => ({
  height: 200,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
  },
}));

export const CartPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '6px',
  maxHeight: 'calc(100dvh - 100px)',
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 165, 0, 0.2)',
}));

export const PriceBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(2),
  bottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontWeight: 700,
  padding: '10px 20px',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  zIndex: 2,
  fontSize: '1.2rem',
}));

export const CategoryBadge = styled(Chip)(({ theme, categorycolor }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  border: `1.5px solid ${categorycolor || theme.palette.primary.main}`,
  color: 'white',
  fontWeight: 600,
  zIndex: 2,
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
  height: '26px',
  '& .MuiChip-label': {
    px: 1.5,
  },
}));

export const SpecialBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  border: `1.5px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  fontWeight: 700,
  padding: '6px 12px',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  borderRadius: '8px',
  zIndex: 3,
  boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '0.5px',
  '& svg': {
    fontSize: '14px',
    marginRight: '5px',
  },
}));

export const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(247, 181, 56, 0.3)',
  padding: '10px 16px',
  minHeight: 44,
  fontWeight: 700,
  backgroundColor: '#F7B538',
  color: '#1A1408',
  textTransform: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: '#FFB800',
    boxShadow: '0 4px 12px rgba(247, 181, 56, 0.4)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));
