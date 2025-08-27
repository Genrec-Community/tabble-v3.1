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
  fontSize: '0.95rem',
  padding: '12px 20px',
  fontWeight: 600,
  textTransform: 'none',
  color: '#FFFFFF',
  borderRadius: '4px',
  marginRight: '8px',
  border: '1px solid rgba(255, 165, 0, 0.3)',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    fontWeight: 700,
    border: '1px solid transparent',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
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
  transition: 'all 0.3s ease',
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: '#121212',
  color: '#FFFFFF',
  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 165, 0, 0.2)',
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
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
  maxHeight: 'calc(100vh - 100px)',
  overflow: 'auto',
  backgroundColor: '#121212',
  color: '#FFFFFF',
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
  borderRadius: '4px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  zIndex: 2,
  fontSize: '1.2rem',
}));

export const CategoryBadge = styled(Chip)(({ theme, categorycolor }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  border: `1px solid ${categorycolor || theme.palette.primary.main}`,
  color: 'white',
  fontWeight: 600,
  zIndex: 2,
  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  fontSize: '0.9rem',
  height: '28px',
}));

export const SpecialBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(2),
  top: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  fontWeight: 700,
  padding: '6px 14px',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  borderRadius: '4px',
  zIndex: 3,
  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    fontSize: '16px',
    marginRight: '6px',
    color: theme.palette.primary.main,
  },
}));

export const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: '4px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  padding: '8px 14px',
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
  },
}));
