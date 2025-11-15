import React, { useContext, useEffect } from 'react';
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
import { Close as CloseIcon, Logout } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

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
    const {user, logout} = useContext(AuthContext);

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
          {flattenedSettings.filter(item => {
        // If no permissions array → allow it
        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((item, index) => {
          console.log(item)
        //  if(item.permissions.includes(user.role)) {
            
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
          )
          //}
          })}
        </List>
      </Box>

       {/* Bottom Logout Section */}
      <Divider />
      <Box>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Logout sx={{ color: theme.palette.error.main }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontWeight: 600,
                color: theme.palette.error.main,
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
}
