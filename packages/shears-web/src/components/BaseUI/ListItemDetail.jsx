// src/components/ListItemDetail.jsx
import React, { useContext, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { FieldMap } from '../../config/component-mapping/FieldMap';
import PlainTextInput from './SmartInputs/PlainTextInput';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { createRecord, updateRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';

// ✅ Helper: safely get value from nested objects
const getValue = (source, path) => {
  if (!source || !path) return '';
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((acc, key) => acc?.[key], source) ?? '';
};

const renderField = (fieldDef, item, handleChange, mode, theme, level = 0, parentPath = '') => {
  const inputType = fieldDef.input || fieldDef.type || 'text';
  const nestedFields = fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  const fieldPath = parentPath ? `${parentPath}.${fieldDef.field}` : fieldDef.field;
  const value = getValue(item, fieldPath);
  console.log("fieldDef")

console.log(fieldDef)
  // ⚙️ useEffect-style init for arrays and objects
  if (fieldDef.arrayConfig?.object && !Array.isArray(value)) handleChange(fieldPath, []);
  else if (fieldDef.objectConfig && (value === undefined || typeof value !== 'object'))
    handleChange(fieldPath, {});

  // 🔁 Handle arrays
  // 🔁 Handle arrays (supports linkSelect arrays)
if (Array.isArray(value)) {
  const handleAddArrayItem = () => {
    // If this is an array of linkSelects, each item starts as null or empty object
    const newItem =
      fieldDef.input === 'linkSelect'
        ? { _id: '', name: '' }
        : Object.fromEntries((nestedFields || []).map((nf) => [nf.field, '']));
    handleChange(fieldPath, [...value, newItem]);
  };

  return (
    <Paper
      key={fieldPath}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1.5,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : 'grey.50',
        ml: level * 2,
        borderColor: theme.palette.divider,
      }}
    >
      <Typography variant="subtitle1" color="text.primary">
        {fieldDef.label || fieldDef.field}
      </Typography>
      <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />

      <Stack spacing={2}>
        {value.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ cursor: mode === 'edit' ? 'pointer' : 'default' }}
            onClick={mode === 'edit' ? handleAddArrayItem : undefined}
          >
            <em>{mode === 'edit' ? '+ Add first entry' : 'No entries'}</em>
          </Typography>
        ) : (
          value.map((entry, idx) => (
            <Paper
              key={`${fieldPath}[${idx}]`}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : 'grey.100',
                borderColor: theme.palette.divider,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" color="text.primary">
                  {(fieldDef.label || fieldDef.field)} #{idx + 1}
                </Typography>

                {(mode === 'edit' || mode === 'add') && (
                  <button
                    onClick={() => {
                      const updatedArray = [...value];
                      updatedArray.splice(idx, 1);
                      handleChange(fieldPath, updatedArray);
                    }}
                    style={{
                      background: theme.palette.error.main,
                      color: theme.palette.error.contrastText || '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </Box>

              {/* 👇 Detect linkSelect vs nestedFields */}
              {fieldDef.input === 'linkSelect' ? (
                <FieldMap.linkSelect
                  label={fieldDef.label || fieldDef.field}
                  value={entry}
                  mode={mode}
                  placeholder={fieldDef.display?.placeholder || ''}
                  onChangeText={(newVal) => {
                    const updated = [...value];
                    updated[idx] = newVal;
                    handleChange(fieldPath, updated);
                  }}
                  recordTypeName={
                    fieldDef.inputConfig?.recordType || 'contacts'
                  }
                />
              ) : (
                <Stack spacing={1}>
                  {nestedFields.map((nestedField) =>
                    renderField(
                      nestedField,
                      item,
                      handleChange,
                      mode,
                      theme,
                      level + 1,
                      `${fieldPath}[${idx}]`
                    )
                  )}
                </Stack>
              )}
            </Paper>
          ))
        )}
      </Stack>

      {(mode === 'edit' || mode === 'add') && (
        <Box sx={{ textAlign: 'right', mt: 2 }}>
          <button
            onClick={handleAddArrayItem}
            style={{
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            + Add {singularize(fieldDef.label || fieldDef.field)}
          </button>
        </Box>
      )}
    </Paper>
  );
}

const isLinkSelectArrayItem =
  parentPath?.includes('[') && fieldDef.input === 'linkSelect';

if (
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  fieldDef.input !== 'linkSelect' &&
  !isLinkSelectArrayItem
) {
    return (
      <Paper
        key={fieldPath}
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor:
            theme.palette.mode === 'dark'
              ? theme.palette.background.default
              : 'grey.50',
          ml: level * 2,
          borderColor: theme.palette.divider,
        }}
      >
        <Typography variant="subtitle1" color="text.primary">
          {fieldDef.label || fieldDef.field}
        </Typography>
        <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />
        <Stack spacing={1}>
          {nestedFields.map((nestedField) =>
            renderField(
              nestedField,
              item,
              handleChange,
              mode,
              theme,
              level + 1,
              fieldPath
            )
          )}
        </Stack>
      </Paper>
    );
  }

  // 🧩 Simple inputs
  return (
    <Paper
      key={fieldPath}
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : 'grey.50',
        ml: level * 2,
        borderColor: theme.palette.divider,
      }}
    >
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
       recordTypeName = {fieldDef.field +"s"}
        placeholder={fieldDef.display?.placeholder || ''}
        multiline={fieldDef.input === 'textarea'}
        keyboardType={fieldDef.input === 'number' ? 'numeric' : 'default'}
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        options={
          fieldDef.inputConfig?.options?.map((opt) =>
            typeof opt === 'string' ? { label: opt, value: opt } : opt
          ) || []
        }
      />
    </Paper>
  );
};

export default function ListItemDetail({ open, onClose, item = {}, appConfig, fields = [], mode: initialMode = 'read', name }) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
console.log("fields")
console.log(fields)

  const initializeItemFromFields = (fields) => {
    const obj = {};
    fields.forEach((f) => {
      if (f.objectConfig) obj[f.field] = initializeItemFromFields(f.objectConfig);
      else if (f.arrayConfig?.object || f.type === 'array') obj[f.field] = [];

      else obj[f.field] = '';
    });
    return obj;
  };

  const initialData = useMemo(() => {
    if (item?.fieldsData) return item.fieldsData;
    if (item && Object.keys(item).length > 0) return item;
    return initializeItemFromFields(fields);
  }, [item, fields]);

  const [localItem, setLocalItem] = React.useState(initialData);
  const [mode, setMode] = React.useState(initialMode);

  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let target = updated;
      while (keys.length > 1) {
        const key = keys.shift();
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      target[keys[0]] = value;
      return updated;
    });
  };

  const handleToggleMode = () => setMode((prev) => (prev === 'read' ? 'edit' : 'read'));

  const handleSave = async () => {
    if (!token) {
      window.alert('Authentication Error', 'Please log in to save data.');
      return;
    }
    try {
      if (mode === 'edit' && item._id) {
        await updateRecord(item._id, localItem, token);
      } else {
        await createRecord(
          localItem,
          name.toLowerCase(),
          token,
          user.subscriberId,
          user.userId
        );
      }
      setMode('read');
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      window.alert('Error', error.message || 'Failed to save item.');
    }
  };

  useEffect(() => {
    setLocalItem(initialData);
    setMode(initialMode);
  }, [item, initialMode]);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: theme.palette.background.paper,

    boxShadow: theme.shadows[6],
    p: 4,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.primary">
            {mode === 'add'
              ? `Add ${singularize(name) || 'Item'}`
              : localItem?.serviceName || localItem?.firstName || 'Item Detail'}
          </Typography>

          <Stack direction="row" spacing={1}>
            {mode === 'add' ? (
              <>
                <button
                  onClick={onClose}
                  style={{
                    background: theme.palette.grey[600],
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    background: theme.palette.success.main,
                    color: theme.palette.success.contrastText || '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </>
            ) : mode === 'read' ? (
              <>
                <button
                  onClick={onClose}
                  style={{
                    background: theme.palette.grey[600],
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={handleToggleMode}
                  style={{
                    background: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleMode}
                  style={{
                    background: theme.palette.grey[600],
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    background: theme.palette.success.main,
                    color: theme.palette.success.contrastText || '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />

        {/* Body */}
        <Stack spacing={2}>
          {fields.map((field) =>
            renderField(field, localItem, handleChange, mode, theme)
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
