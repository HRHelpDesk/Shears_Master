import React, { useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  IconButton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export default function SettingsDrawer({
  settings = [],
  open = true,
  onClose,
  title = 'Settings',
  onSelectSetting
}) {
  const theme = useTheme();

  useEffect(() => {
    console.log('Settings data:', settings);
  }, [settings]);

  // Flatten array-of-arrays (in case settings is nested)
  const flattenedSettings = Array.isArray(settings[0])
    ? settings.flat()
    : settings;

      useEffect(() => {
    console.log('Settings data:', settings);
    console.log("Flattended:", flattenedSettings)
  }, [settings]);
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
        },
      }}
    >
      {/* Header */}
      <DrawerHeader>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DrawerHeader>

      {/* Settings List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List>
          {flattenedSettings.map((item, index) => {
          console.log(item)
           return (
            <React.Fragment key={index}>
              <ListItem disablePadding>
            <ListItemButton onClick={() => onSelectSetting(item)}>
                  {/* Render Font Awesome web icon */}
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon?.web && (
                      <i
                        className={item.icon.web}
                        style={{
                          fontSize: 18,
                          color: theme.palette.primary.main,
                          width: 20,
                          textAlign: 'center',
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.displayName}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                    }}
                  />
                </ListItemButton>
              </ListItem>
              {item.divider && <Divider />}
            </React.Fragment>
          )})}
        </List>
      </Box>
    </Drawer>
  );
}
