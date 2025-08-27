import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { StyledTabs, CategoryTab } from './MenuStyled';

const MenuCategories = ({ categories, currentCategory, handleCategoryChange, loading }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={3}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <StyledTabs
      value={currentCategory}
      onChange={handleCategoryChange}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 4, mt: 2 }}
    >
      {categories.map((category) => (
        <CategoryTab key={category} label={category} value={category} />
      ))}
    </StyledTabs>
  );
};

export default MenuCategories;
