import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Paper,
  Divider,
  MenuItem,
  Grid,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { humanizeFieldName } from 'shears-shared/src/utils/stringHelpers';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../context/AuthContext';
import { createRecord } from 'shears-shared/src/Services/Authentication';
import PlainTextInput from './SmartInputs/PlainTextInput';
import { FieldMap } from '../../config/component-mapping/FieldMap';

/* ------------------------------------------------------------------
   Styled Drawer
------------------------------------------------------------------ */
const DrawerPaper = styled(Paper)(({ theme, primaryColor, secondaryColor }) => ({
  width: 420,
  height: '100vh',
  padding: theme.spacing(3),
  paddingTop: theme.spacing(10),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  background: `linear-gradient(to bottom, ${primaryColor}33, ${secondaryColor}33)`,
  position: 'relative',
  overflow: 'auto',
}));

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */
export default function ItemDrawer({
  open,
  onClose,
  mode: initialMode = 'read',
  item = {},
  fields = [],
  appConfig,
  name = 'Item',
}) {
  const [mode, setMode] = useState(initialMode);
  const [formValues, setFormValues] = useState({});
  const isReadOnly = mode === 'read';
  const { user, token } = useContext(AuthContext);

  const primaryColor = appConfig?.themeColors?.primary || '#1976d2';
  const secondaryColor = appConfig?.themeColors?.secondary || '#ffffff';

  /* ------------------------------------------------------------------
     Setup
  ------------------------------------------------------------------ */
  console.log(fields)
  const mergedFields = useMemo(() => mapFields(fields), [fields]);
  console.log('Merged Fields:', mergedFields);  

  useEffect(() => {
    setMode(initialMode);

    if (initialMode === 'add') {
      const initialized = {};
      mergedFields.forEach((f) => {
        if (f.type?.toLowerCase() === 'array') initialized[f.field] = [];
        else if (f.type?.toLowerCase() === 'object') initialized[f.field] = {};
        else initialized[f.field] = '';
      });
      setFormValues(initialized);
    } else if (item) {
      setFormValues(item.fieldsData);
    }
  }, [open, initialMode, item, mergedFields]);

  /* ------------------------------------------------------------------
     Handlers
  ------------------------------------------------------------------ */
  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  const handleNestedChange = (field, index, key, value) => {
    setFormValues((prev) => {
      const updated = [...(prev[field] || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [field]: updated };
    });
  };

  const handleAddNestedItem = (field) => {
    const fieldDef = mergedFields.find((f) => f.field === field);
    const emptyObj = {};
    fieldDef?.arrayConfig?.object?.forEach((sub) => {
      emptyObj[sub.field] = sub.defaultValue || '';
    });
    setFormValues((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), emptyObj],
    }));
  };

  const handleAdd = async () => {
    const newRecord = {
      recordType: name.toLowerCase(),
      fieldsData: formValues,
    };
    if (!token) return alert('Authentication Error: Please log in to save data.');

    try {
      await createRecord(
        appConfig,
        formValues,
        appConfig.defaultRoute.toLowerCase(),
        token,
        user.subscriberId,
        user.userId
      );
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      alert(error.message || 'Failed to save item. Please try again.');
    }
  };

  const handleEdit = async () => setMode('read');

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      onClose();
    }
  };

  const initials =
    formValues.firstName && formValues.lastName
      ? `${formValues.firstName[0]}${formValues.lastName[0]}`
      : '?';

  /* ------------------------------------------------------------------
     Render Helpers
  ------------------------------------------------------------------ */
  const renderInputField = (field, value, onChange) => {
    const InputComponent = FieldMap[field.input] || PlainTextInput;
    return (
      <InputComponent
        key={field.field}
        label={humanizeFieldName(field.label || field.field)}
        value={value}
        onChangeText={(newValue) => onChange(field.field, newValue)}
        multiline={field.input === 'textarea'}
        placeholder={field.display?.placeholder || ''}
        recordTypeName={field.linkedRecordType || ''}
      />
    );
  };

  const renderArraySection = (fieldKey, values = []) => {
    const fieldDef = mergedFields.find((f) => f.field === fieldKey);

    const handleRemoveNestedItem = (index) => {
      setFormValues((prev) => {
        const updated = [...(prev[fieldKey] || [])];
        updated.splice(index, 1);
        return { ...prev, [fieldKey]: updated };
      });
    };

    return (
      <Paper
        key={fieldKey}
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : '#f9f9f9',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {humanizeFieldName(fieldKey)}
        </Typography>
        <Divider sx={{ mb: 1 }} />

        {values.length === 0 && isReadOnly ? (
          <Typography variant="body2" color="text.secondary">
            None
          </Typography>
        ) : (
          values.map((entry, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 1,
                mb: 2,
                borderRadius: 2,
                background: '#ffffff22',
                position: 'relative',
              }}
            >
              {!isReadOnly && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveNestedItem(idx)}
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}

              <Grid container spacing={2}>
                {fieldDef.arrayConfig?.object?.map((sub) => (
                  <Grid item xs={12} sm={6} key={sub.field}>
                    {isReadOnly ? (
                      <Typography variant="body2">
                        <strong>{sub.label || sub.field}:</strong>{' '}
                        {entry[sub.field] || '(empty)'}
                      </Typography>
                    ) : (
                      renderInputField(sub, entry[sub.field], (key, val) =>
                        handleNestedChange(fieldKey, idx, sub.field, val)
                      )
                    )}
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))
        )}

        {!isReadOnly && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleAddNestedItem(fieldKey)}
            size="small"
            sx={{ mt: 1 }}
          >
            Add {humanizeFieldName(fieldKey)}
          </Button>
        )}
      </Paper>
    );
  };

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <DrawerPaper
        elevation={3}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      >
        {/* Close Button */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            src={formValues.avatar}
            sx={{ width: 100, height: 100, bgcolor: primaryColor }}
          >
            {!formValues.avatar && initials}
          </Avatar>
        </Box>

        {/* Header */}
        <Typography variant="h6" textAlign="center" fontWeight="bold">
          {mode === 'add'
            ? `Add ${name}`
            : mode === 'edit'
            ? `Edit ${name}`
            : `${name} Details`}
        </Typography>

        {/* Actions */}
        {mode === 'read' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <IconButton onClick={() => setMode('edit')}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Fields */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            px: 0.5,
          }}
        >
          {mergedFields.map((field) => {
            const value = formValues[field.field];
            const type = field.type?.toLowerCase();

            if (type === 'array')
              return renderArraySection(
                field.field,
                Array.isArray(value) ? value : []
              );

            if (type === 'object') {
              const objectValues =
                typeof value === 'object' && value !== null ? value : {};
              return (
                <Paper
                  key={field.field}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.background.paper
                        : '#f7f7f7',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {humanizeFieldName(field.label || field.field)}
                  </Typography>
                  <Grid container spacing={2}>
                    {field.properties?.map((subField) => (
                      <Grid item xs={12} sm={6} md={4} key={subField.field}>
                        {isReadOnly ? (
                          <Typography variant="body2">
                            <strong>{subField.label || subField.field}:</strong>{' '}
                            {objectValues[subField.field] || '(empty)'}
                          </Typography>
                        ) : (
                          renderInputField(
                            subField,
                            objectValues[subField.field],
                            (key, val) =>
                              setFormValues((prev) => ({
                                ...prev,
                                [field.field]: {
                                  ...objectValues,
                                  [subField.field]: val,
                                },
                              }))
                          )
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              );
            }

            // --- Default primitives ---
            return (
              <Box
                key={field.field}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center',
                  gap: 2,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : '#f5f5f5',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body1"
                  fontWeight="500"
                  sx={{ color: 'text.secondary' }}
                >
                  {humanizeFieldName(field.label || field.field)}
                </Typography>
                {isReadOnly ? (
                  <Typography variant="body2" color="text.primary">
                    {value || '(empty)'}
                  </Typography>
                ) : (
                  renderInputField(field, value, handleInputChange)
                )}
              </Box>
            );
          })}
        </Box>

        {/* Footer */}
        {mode === 'add' && (
          <Button
            variant="contained"
            sx={{ mt: 3, bgcolor: primaryColor }}
            onClick={handleAdd}
          >
            Add {name}
          </Button>
        )}
        {mode === 'edit' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
            onClick={handleEdit}
          >
            Save Changes
          </Button>
        )}
      </DrawerPaper>
    </Drawer>
  );
}
