import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

export default function TabBar({ views = [], activeTab, onTabChange }) {
      console.log(views.length)

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0, display: views.length > 1 ? 'block':'none' }}>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
      >
        {views.map((view, index) => (
          <Tab key={index} label={view.displayName || view.name} />
        ))}
      </Tabs>
    </Box>
  );
}
